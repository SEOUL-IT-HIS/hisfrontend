export type SurgeryPlannedItem = {
  plannedItemId: string;
  surgeryId: string;
  itemTypeCd: string;
  itemCode: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSurgeryPlannedItemRequest = {
  itemTypeCd: string;
  itemCode: string;
  quantity: number;
};
