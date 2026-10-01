export type StudioPublicationState =
  | 'draft'
  | 'authorized'
  | 'delivered'
  | 'revoked'
  | 'retained'
  | 'deleted';

export type StudioPublicationContract = {
  schemaVersion: 1;
  tenantId: string;
  exportId: string;
  versionId: string;
  contentHash: string;
  targetChannel: string;
  rightsClearanceRef: string;
  accessibilityClearanceRef: string;
  privacyClearanceRef: string;
  claimsClearanceRef: string;
  approvalRefs: string[];
  state: StudioPublicationState;
  deliveryReceiptRef?: string;
  revokeReceiptRef?: string;
  retentionPolicyRef: string;
  deletionReceiptRef?: string;
  publicReleaseAuthorized: false;
  deliveryEnabled: false;
};

export function createHardOffPublicationContract(
  input: Omit<StudioPublicationContract, 'schemaVersion' | 'state' | 'publicReleaseAuthorized' | 'deliveryEnabled'>,
): StudioPublicationContract {
  return {
    schemaVersion: 1,
    ...input,
    state: 'draft',
    publicReleaseAuthorized: false,
    deliveryEnabled: false,
  };
}

export function canPublishStudioContract(_contract: StudioPublicationContract): false {
  return false;
}
