# Apna AI POS — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Tenant Isolation**: A merchant user (`request.auth.uid`) can ONLY read, list, create, update, or delete stores and store subcollection documents where `ownerId == request.auth.uid` (or Super Admin `bashirsonselectric@gmail.com` with `email_verified == true`).
2. **Master Gate Parent Ownership**: Every subcollection document under `/stores/{storeId}/*` requires the parent `/stores/{storeId}` document to exist and have `ownerId == request.auth.uid`.
3. **Immutable Ownership & Timestamps**: `ownerId`, `storeId`, `id`, and `createdAt` can never be changed after creation. Timestamps must match `request.time`.
4. **No Self-Assigned Admin Roles**: Users creating `/users/{uid}` must have `role == 'owner'` and cannot escalate their own role during update.
5. **Terminal Sale Locking**: Once a sale reaches `status == 'refunded'` or `status == 'void'`, non-admin updates are strictly blocked.
6. **Append-Only Audit Trail**: `/stores/{storeId}/activityLogs/{logId}` documents cannot be mutated or deleted by regular users after creation.

## 2. Adversarial "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Cross-Tenant Store Read**: User B attempts `get('/stores/store_of_user_A')`.
2. **Cross-Tenant List Scraping**: User B runs unfiltered `list('/stores')` without matching `ownerId == B`.
3. **Shadow Field Injection**: User A creates a Product with extra ghost field `isApproved: true`.
4. **Role Escalation on Create**: User B creates `/users/userB` with `role: 'admin'`.
5. **Role Escalation on Update**: User B updates `/users/userB` attempting to change `role` to `'admin'`.
6. **Owner Spoofing**: User B creates `/stores/fake1/products/p1` with `ownerId: 'userA'`.
7. **Orphaned Subcollection Write**: User A writes `/stores/nonexistent_store/products/p1`.
8. **ID Poisoning**: User A writes `/stores/a...200chars.../products/p1` or invalid regex ID `../hack`.
9. **Client Timestamp Tampering**: User A creates a Sale with backdated `createdAt: Timestamp(2020-01-01)`.
10. **Terminal Sale Mutation**: User A modifies `grandTotal` on a `status: 'refunded'` Sale.
11. **Activity Log Tampering**: User A updates or deletes an existing `/stores/{storeId}/activityLogs/{logId}`.
12. **Unverified Admin Email Spoof**: Caller with `email: 'bashirsonselectric@gmail.com'` and `email_verified: false` attempts admin read.
