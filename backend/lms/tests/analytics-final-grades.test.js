const {test}=require('node:test');const assert=require('node:assert/strict');
const database=require.resolve('../../config/database');const original=require.cache[database];let rows=[],query;
require.cache[database]={id:database,filename:database,loaded:true,exports:{assessmentSubmission:{findMany:async q=>{query=q;return rows;}}}};
const {getAssessmentAnalytics}=require('../../repositories/analyticsRepository');
if(original)require.cache[database]=original;else delete require.cache[database];
const grade=(score,status='GRADED',passPercentage=60)=>({id:1,score,totalMarks:100,percentage:score,status,assessment:{passPercentage}});
test('only final valid grades count and each assessment uses its configured pass threshold',async()=>{
 rows=[grade(50),grade(70,'COMPLETED'),grade(70,'PASSED',80),grade(100,'SUBMITTED'),grade(100,'IN_PROGRESS'),grade(100,'FAILED'),grade(null),grade(101)];
 const r=await getAssessmentAnalytics({fromDate:'2026-11-02',toDate:'2026-11-08'});
 assert.equal(r.totalSubmissions,3);assert.equal(r.averagePercentage,63.33);assert.equal(r.passed,1);assert.equal(r.failed,2);assert.equal(r.passRate,33.33);
 assert.deepEqual(query.where.status.in,['COMPLETED','GRADED','PASSED']);assert.ok(query.where.submittedAt);
});
test('ungraded rows never become final-score samples',async()=>{
 rows=[grade(20,'SUBMITTED'),grade(0,'GRADING')];const r=await getAssessmentAnalytics();
 assert.equal(r.totalSubmissions,0);assert.equal(r.averagePercentage,0);
});
