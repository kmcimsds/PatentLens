// 브라우저 번들에서 Node 내장 모듈(node:fs 등) 참조를 대체하는 빈 모듈.
// pptxgenjs가 Node 실행 경로에서만 사용하는 코드라 브라우저에서는 호출되지 않는다.
module.exports = {};
