/**
 * 직원 화면용 공통코드 라벨 변환
 * - DB/API 에는 codeValue(01) 저장
 * - 화면에는 codeName(내과) 표시
 */
import type { SelectOption } from "@/components/common";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";

/** codeValue → codeName. 없으면 원본 값 그대로 */
export function toCodeLabel(
  items: CommonCodeItem[],
  codeValue: string | null | undefined,
): string {
  if (!codeValue) return "-";
  return items.find((item) => item.codeValue === codeValue)?.codeName ?? codeValue;
}

/** Select options: value=코드값, label=코드명 */
export function toCodeSelectOptions(items: CommonCodeItem[]): SelectOption[] {
  return items.map((item) => ({
    value: item.codeValue,
    label: item.codeName,
  }));
}
