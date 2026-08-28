-- PATIENT 테이블에 ADDRESS / PHONE_NO 가 비어있는 환자 채우기
-- (ADDRESS_DETAIL은 요청대로 채우지 않음)
--
-- 스키마 접두어(PATIENT.PATIENT 등)가 필요하면 아래 PATIENT를 실제 스키마.테이블명으로 바꿔주세요.

UPDATE PATIENT
SET ADDRESS = '경남 진주시 가좌길74번길 8',
    PHONE_NO = '01099990001'
WHERE PATIENT_ID = 'c837495d-a515-445e-ac7c-afa9c169e38b'; -- 테스트

UPDATE PATIENT
SET ADDRESS = '경남 진주시 가좌길74번길 8',
    PHONE_NO = '01099990002'
WHERE PATIENT_ID = '5e5d70e3-675f-4555-b1c6-58f9255cc1ae'; -- 테스...

UPDATE PATIENT
SET ADDRESS = '경남 진주시 가좌길74번길 8',
    PHONE_NO = '01099990003'
WHERE PATIENT_ID = '6551e88e-ffbd-43db-99d3-8ab4172d88ac'; -- 박근태

COMMIT;
