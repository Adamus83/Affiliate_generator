# Security Specification for Firestore Security Rules

## 1. Data Invariants
1. **User Profiles (`/users/{userId}`)**:
   - Must be uniquely identified by their string ID (`userId`), matching the pattern `^USR-\d+$`.
   - The `id` field inside the document must be immutable once created.
   - The `credits` field must be a non-negative integer.
   - PII data (`phone` and `name`) is protected, only accessible to the profile owner or verified admins.

2. **Topup Transactions (`/transactions/{transactionId}`)**:
   - Must be uniquely identified by a transaction ID matching `^TX-[A-Z0-9\-]+$`.
   - The `status` field must only be one of: `PENDING`, `APPROVED`, or `REJECTED`.
   - Once a transaction status becomes `APPROVED` or `REJECTED`, it is locked and can never be modified again (Terminal State Locking).
   - Only admin is allowed to approve or reject transactions. Standard users cannot modify transaction statuses.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Create user with negative credits
- **Target Path**: `/users/USR-999999`
- **Data**: `{ "id": "USR-999999", "name": "Hacker", "phone": "081223", "credits": -10 }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 2: Create user with bloated credits
- **Target Path**: `/users/USR-999999`
- **Data**: `{ "id": "USR-999999", "name": "Hacker", "phone": "081223", "credits": 999999 }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 3: Create user with invalid ID format
- **Target Path**: `/users/USR-XYZ!!!`
- **Data**: `{ "id": "USR-XYZ!!!", "name": "Hacker", "phone": "081223", "credits": 5 }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 4: Spoof user profile (modify other user's profile)
- **Target Path**: `/users/USR-111111` (Attempted by user `USR-222222`)
- **Data**: `{ "id": "USR-111111", "name": "Spoofed", "phone": "081223", "credits": 5 }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 5: Submit transaction with pre-approved status
- **Target Path**: `/transactions/TX-999999`
- **Data**: `{ "id": "TX-999999", "userId": "USR-222222", "userName": "Hacker", "userPhone": "081223", "packageName": "Starter (10 Credits)", "amount": 10000, "creditsGained": 10, "status": "APPROVED", "createdAt": "2026-05-23T12:00:00Z" }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 6: User approves their own transaction
- **Target Path**: `/transactions/TX-888888`
- **Data**: Change status from `PENDING` to `APPROVED` as a standard user
- **Expectation**: `PERMISSION_DENIED`

### Payload 7: Set user role to Admin in custom document
- **Target Path**: `/admins/USR-222222`
- **Data**: `{ "isAdmin": true }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 8: Mutate transaction `userId` during update
- **Target Path**: `/transactions/TX-888888`
- **Data**: `{ "id": "TX-888888", "userId": "USR-ATTACKER", "status": "APPROVED" }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 9: Modify immutable `createdAt` timestamp
- **Target Path**: `/transactions/TX-888888`
- **Data**: Change `createdAt` from a past date to a new date
- **Expectation**: `PERMISSION_DENIED`

### Payload 10: Inject massive 1MB string into user phone parameter
- **Target Path**: `/users/USR-999999`
- **Data**: `{ "id": "USR-999999", "name": "Hacker", "phone": "081223" + "A".repeat(1000000), "credits": 5 }`
- **Expectation**: `PERMISSION_DENIED`

### Payload 11: Change approved transaction status back to pending
- **Target Path**: `/transactions/TX-888888`
- **Data**: Change status from `APPROVED` to `PENDING`
- **Expectation**: `PERMISSION_DENIED`

### Payload 12: Read entire user directory listing (PII Leak test)
- **Target Path**: Get all documents from `/users` as an unauthenticated/unrelated user
- **Expectation**: `PERMISSION_DENIED`

---

## 3. Test Suite Runner (`firestore.rules.test.ts`)
```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "gen-lang-client-0071024126",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          // Rule specification will be validated here
        }
      `
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});
```
