/**
 * 전역 공통 UI
 *
 * 다른 서비스(features/{service}, components/{service}) 에서는
 * 아래처럼 import 해서 목록/등록/수정 화면을 구성한다.
 *
 * @example
 * import {
 *   Alert, Button, DataTable, FormActions, FormField,
 *   Input, Modal, PageHeader, Panel, SearchBar, Select, StatusBadge,
 * } from "@/components/common";
 *
 * // 목록: PageHeader + SearchBar + DataTable + Pagination
 * // 등록/수정: Modal + FormField + Input/Select + FormActions
 * // 상태값: StatusBadge (Y/N)
 * // 패널 카드: Panel
 */
export { default as Alert } from "@/components/common/Alert";
export { default as Button } from "@/components/common/Button";
export { default as ConfirmDialog } from "@/components/common/ConfirmDialog";
export { default as DataTable } from "@/components/common/DataTable";
export type { DataTableColumn } from "@/components/common/DataTable";
export { default as FormActions } from "@/components/common/FormActions";
export { default as FormField } from "@/components/common/FormField";
export { default as Input } from "@/components/common/Input";
export { default as Modal } from "@/components/common/Modal";
export { default as PageHeader } from "@/components/common/PageHeader";
export { default as Pagination } from "@/components/common/Pagination";
export { default as Panel } from "@/components/common/Panel";
export { default as SearchBar } from "@/components/common/SearchBar";
export { default as Select } from "@/components/common/Select";
export type { SelectOption } from "@/components/common/Select";
export { default as StatusBadge } from "@/components/common/StatusBadge";
