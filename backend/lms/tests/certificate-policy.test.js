const {test}=require('node:test');const assert=require('node:assert/strict');
const {completion}=require('../completion');
const course={completionThreshold:80,modules:[{lessons:[{id:1}],assessments:[{id:2,status:'ACTIVE',passPercentage:60}]}]};
const progress=[{lessonId:1,completed:true}];
test('course without required assessments cannot award a certificate',()=>assert.equal(completion({...course,modules:[{lessons:[{id:1}],assessments:[]}]},progress,[]).eligible,false));
for(const status of ['IN_PROGRESS','SUBMITTED','FAILED'])test(status+' cannot award a certificate',()=>assert.equal(completion(course,progress,[{assessmentId:2,status,percentage:100}]).eligible,false));
for(const percentage of [null,NaN,Infinity,101,-1])test('invalid score '+percentage+' cannot award a certificate',()=>assert.equal(completion(course,progress,[{assessmentId:2,status:'GRADED',percentage}]).eligible,false));
test('completed course with final passing assessment is eligible',()=>assert.equal(completion(course,progress,[{assessmentId:2,status:'GRADED',percentage:60}]).eligible,true));
