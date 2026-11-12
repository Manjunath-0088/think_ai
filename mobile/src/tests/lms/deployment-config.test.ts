import { normalizeApiBase } from '@/lms/deployment';
test('normalizes host-only and trailing-slash API configuration',()=>{
 expect(normalizeApiBase('https://example.invalid')).toBe('https://example.invalid/api');
 expect(normalizeApiBase('https://example.invalid/api/')).toBe('https://example.invalid/api');
});
for(const url of ['https://example.invalid/api/api','https://example.invalid/other','https://name:secret@example.invalid/api','https://example.invalid/api?token=secret'])test('rejects invalid API base '+url,()=>expect(()=>normalizeApiBase(url)).toThrow());
