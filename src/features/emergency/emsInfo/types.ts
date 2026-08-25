/**
 * EMS(119) 이송정보 — UC-TRI-01 (Jira UD2-8)
 * 백엔드 EmsReferralDto 필드를 그대로 미러링한다.
 * (kr.co.seoulit.his.emergencyservice.triage.dto.EmsReferralDto)
 */
export interface EmsReferral {
  id: string;
  receptionNo: string;
  emsAgencyName: string;
  vitalsOnScene: string;
  prehospitalTreatment: string;
  /** LocalDateTime → ISO 8601 문자열 */
  transmittedAt: string;
}

/** EMS 정보 조회 slice 상태 */
export interface EmsInfoState {
  items: EmsReferral[];
  loading: boolean;
  error: string;
  /** 조회 버튼을 한 번이라도 눌렀는지 (초기 진입과 "조회 결과 없음"을 구분) */
  searched: boolean;
}
