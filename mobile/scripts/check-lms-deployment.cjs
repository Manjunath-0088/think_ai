// Read-only contract preflight. Never starts attempts or sends grades/mail.
const API='https://40.192.27.248/api';
const required={
  '/api/lms/progress/sync':'post',
  '/api/lms/assessments/{id}/start':'post',
  '/api/lms/assessments/{id}/submit':'post',
  '/api/lms/attempts/{id}/results':'get',
  '/api/lms/certificates/generate':'post',
  '/api/lms/certificates/{id}/pdf':'get',
  '/api/lms/analytics/export':'get',
};
async function checkDeployment({token=process.env.LMS_CHECK_TOKEN,fetchImpl=fetch}={}){
  const report={at:new Date().toISOString(),api:API,status:'BLOCKED',checks:[],mutationsPerformed:false,
    limitations:['Passing this preflight does not prove grading, video playback, S3 storage, inbox receipt or performance.']};
  async function get(route,authenticated=false){
    if(authenticated&&!token){report.checks.push({route,status:'NOT_RUN',reason:'Approved session token required through LMS_CHECK_TOKEN'});return null;}
    try{const response=await fetchImpl(API+route,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',...(authenticated?{Authorization:`Bearer ${token}`}:{})}});
      report.checks.push({route,httpStatus:response.status,status:response.status===200?'PASS':'FAIL'});
      if(response.status!==200){await response.body?.cancel();return null;}
      return await response.json();
    }catch{report.checks.push({route,status:'FAIL',reason:'Request or JSON validation failed'});return null;}
  }
  const spec=await get('/lms-openapi.json');
  for(const [route,method] of Object.entries(required))report.checks.push({route,method:method.toUpperCase(),status:spec?.paths?.[route]?.[method]?'PASS':'FAIL',kind:'documented contract'});
  const account=await get('/lms/me',true),enrollments=await get('/lms/enrollments',true);
  if(account?.success!==true||!account.data||enrollments?.success!==true||!Array.isArray(enrollments.data))report.checks.push({status:'FAIL',kind:'authenticated response shape'});
  if(report.checks.every(c=>c.status==='PASS'))report.status='READ_CONTRACT_READY';
  return report;
}
module.exports={checkDeployment};
if(require.main===module)checkDeployment().then(report=>{
  if(process.env.LMS_CHECK_REPORT)require('fs').writeFileSync(process.env.LMS_CHECK_REPORT,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));process.exitCode=report.status==='READ_CONTRACT_READY'?0:2;
}).catch(()=>{console.error('Deployment check failed.');process.exitCode=2;});
