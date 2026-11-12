const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function load(file,deps){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),{module,exports:module.exports,require:n=>{if(n in deps)return deps[n];throw Error(n)},console,process,Date,Math,Number});return module.exports;}
async function assessment(submissions,include=true){const prisma={enrollment:{findUnique:async()=>({batch:{course:{modules:[{assessments:include?[{id:1,title:'Exam',passPercentage:60,submissions}]:[]}]}}})}};return load('repositories/assessmentRepository.js',{'../config/database':prisma}).getEnrollmentAssessmentStatus(1);}
test('no assessments cannot qualify',async()=>assert.equal((await assessment([],false)).allPassed,false));
for(const status of ['IN_PROGRESS','SUBMITTED','FAILED'])test(`${status} cannot qualify even with full marks`,async()=>assert.equal((await assessment([{status,percentage:100}])).allPassed,false));
test('failed marks cannot qualify',async()=>assert.equal((await assessment([{status:'COMPLETED',percentage:59}])).allPassed,false));
test('final passing result qualifies',async()=>assert.equal((await assessment([{status:'COMPLETED',percentage:60}])).allPassed,true));
test('missing result cannot qualify',async()=>assert.equal((await assessment([])).allPassed,false));
async function generate(progress,assessmentStatus,enrollment=true){let writes=0;const service=load('services/certificateService.js',{
 '../repositories/certificateRepository':{getCertificateByEnrollment:async()=>null,createCertificate:async()=>{writes++;return {id:1}},getActiveCertificateTemplate:async()=>({})},
 '../repositories/lessonProgressRepository':{getProgressSummary:async()=>progress},
 './assessmentService':{getEnrollmentAssessmentStatus:async()=>assessmentStatus},
 '../config/database':{enrollment:{findUnique:async()=>enrollment?{studentName:'Learner',studentEmail:'learner@example.invalid',batch:{course:{title:'Course'}}}:null},certificate:{update:async()=>({certificateNo:'test'})}},
 '../utils/certificatePdf':{generateCertificatePdf:async()=>{writes++;return 'test.pdf'}},
 './notificationQueueService':{enqueue:()=>{writes++}},'./notificationService':{certificateEmail:()=>({})}
 });try{await service.generateCertificate(1);return {ok:true,writes}}catch(error){return {ok:false,writes}}}
const passed={allPassed:true,totalAssessments:1,passedAssessments:1};
for(const [name,progress,status,enrollment] of [
 ['below 80%',{totalLessons:10,completionPercentage:79},passed,true],
 ['empty course',{totalLessons:0,completionPercentage:100},passed,true],
 ['assessment not passed',{totalLessons:10,completionPercentage:100},{...passed,allPassed:false},true],
 ['zero assessments despite allPassed',{totalLessons:10,completionPercentage:100},{allPassed:true,totalAssessments:0,passedAssessments:0},true],
 ['missing enrollment',{totalLessons:10,completionPercentage:100},passed,false]
])test(`no certificate/PDF/email when ${name}`,async()=>assert.deepEqual(await generate(progress,status,enrollment),{ok:false,writes:0}));
test('all three rules permit certificate/PDF/email',async()=>assert.deepEqual(await generate({totalLessons:10,completionPercentage:80},passed),{ok:true,writes:3}));

async function automation(progress,status){let generated=0;const svc=load('services/automationService.js',{
 '../repositories/lessonProgressRepository':{getProgressSummary:async()=>progress},
 './assessmentService':{getEnrollmentAssessmentStatus:async()=>status},
 './certificateService':{generateCertificate:async()=>{generated++;return {id:1}}}
 });const result=await svc.processLessonCompletion(1);return {triggered:result.triggered,generated};}
for(const [label,progress,status] of [
 ['missing progress',{totalLessons:2,completionPercentage:NaN},passed],
 ['no lessons',{totalLessons:0,completionPercentage:100},passed],
 ['below completion',{totalLessons:2,completionPercentage:79},passed],
 ['no assessments',{totalLessons:2,completionPercentage:100},{allPassed:true,totalAssessments:0,passedAssessments:0}],
 ['unfinished assessments',{totalLessons:2,completionPercentage:100},{...passed,allPassed:false}]
])test(`automation blocks ${label}`,async()=>assert.deepEqual(await automation(progress,status),{triggered:false,generated:0}));
test('automation issues only after completion and passed assessments',async()=>assert.deepEqual(await automation({totalLessons:2,completionPercentage:80},passed),{triggered:true,generated:1}));
