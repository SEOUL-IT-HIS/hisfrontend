/**
 * 올리려고 고른 File 을 saga 가 꺼낼 때까지 잠깐 들고 있는다.
 *
 * File 은 직렬화할 수 없는 값이라 액션 payload 에 실으면 Redux Toolkit 이 개발 모드에서 경고한다.
 * 이를 피하는 공통 설정(store.ts 의 serializableCheck)은 리더 관리 파일이라 응급 쪽에서 바꾸지 않고,
 * 액션에는 키만 실어 보내고 File 은 여기에 둔다. saga 가 take 하면 바로 지워지므로 오래 남지 않는다.
 */
const held = new Map<string, File>();
let sequence = 0;

/** File 을 맡기고 꺼낼 때 쓸 키를 받는다 */
export function holdUploadFile(file: File): string {
  sequence += 1;
  const key = `upload-${Date.now()}-${sequence}`;
  held.set(key, file);
  return key;
}

/** 맡겨 둔 File 을 꺼낸다(한 번만 꺼내진다). 없으면 undefined */
export function takeUploadFile(key: string): File | undefined {
  const file = held.get(key);
  held.delete(key);
  return file;
}
