# Private Label Order API - Testing Guide

## Backend Setup Complete! ✅

The backend is ready for testing. Here's everything you need to know.

---

## API Endpoint

**POST** `http://localhost:5000/api/orders/private-label`

---

## Request Format

**Content-Type:** `multipart/form-data` (for file uploads)

### Required Fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `repId` | String (ObjectId) | Rep's MongoDB ID | `"507f1f77bcf86cd799439011"` |
| `storeId` | String (ObjectId) | Store's MongoDB ID | `"507f1f77bcf86cd799439012"` |
| `privateLabelType` | String | Product type | `"BIOMAX"` or `"Rosin"` |
| `flavor` | String | Gummy flavor | `"Strawberry"` |

### Optional Fields:

| Field | Type | Description | Example | Default |
|-------|------|-------------|---------|---------|
| `quantity` | Number | Number of cases | `150` | `100` |
| `labelImages` | File[] | Label image files (PNG/JPG/PDF) | Upload files | `[]` |
| `deliveryDate` | String | ISO date format | `"2025-01-15"` | `null` |
| `discount` | Number | Discount amount | `50.00` | `0` |
| `note` | String | Additional notes | `"Rush order"` | `null` |

---

## Pricing Configuration

Current pricing (can be updated in `orderController.ts`):

```javascript
BIOMAX: {
  unitPrice: 45.00,
  defaultQuantity: 100
}

Rosin: {
  unitPrice: 55.00,
  defaultQuantity: 100
}
```

**Calculations:**
- Subtotal = `quantity × unitPrice`
- Total = `subtotal - discount`

---

## Testing with Postman

### Step 1: Create New Request

1. Open Postman
2. Create a new **POST** request
3. URL: `http://localhost:5000/api/orders/private-label`

### Step 2: Setup Body

1. Select **Body** tab
2. Choose **form-data** (NOT raw JSON)
3. Add the following fields:

#### Basic Test (Without Images):

| KEY | VALUE | TYPE |
|-----|-------|------|
| `repId` | `YOUR_REP_ID` | Text |
| `storeId` | `YOUR_STORE_ID` | Text |
| `privateLabelType` | `BIOMAX` | Text |
| `flavor` | `Strawberry Lemonade` | Text |
| `quantity` | `100` | Text |
| `note` | `First test order` | Text |

#### Full Test (With Images):

| KEY | VALUE | TYPE |
|-----|-------|------|
| `repId` | `YOUR_REP_ID` | Text |
| `storeId` | `YOUR_STORE_ID` | Text |
| `privateLabelType` | `Rosin` | Text |
| `flavor` | `Blue Raspberry` | Text |
| `quantity` | `150` | Text |
| `deliveryDate` | `2025-01-20` | Text |
| `discount` | `100` | Text |
| `note` | `Custom label test` | Text |
| `labelImages` | [SELECT FILE] | File |
| `labelImages` | [SELECT FILE] | File |

**Note:** You can add multiple `labelImages` fields (up to 5 files)

### Step 3: Add Files (Optional)

1. For each `labelImages` row, click the dropdown and select **File**
2. Click **Select Files** and choose image files
3. Accepted formats: PNG, JPG, JPEG, PDF
4. Max size: 5MB per file

### Step 4: Send Request

Click **Send** button

---

## Expected Response

### Success Response (201 Created):

```json
{
  "message": "Private label order created successfully",
  "order": {
    "_id": "6789abcd1234567890abcdef",
    "orderNumber": 1001,
    "isPrivateLabel": true,
    "privateLabelType": "BIOMAX",
    "flavor": "Strawberry Lemonade",
    "quantity": 100,
    "subtotal": 4500.00,
    "discount": 0,
    "total": 4500.00,
    "labelImages": [
      {
        "url": "https://res.cloudinary.com/..../image.jpg",
        "secureUrl": "https://res.cloudinary.com/..../image.jpg",
        "publicId": "private-labels/abc123",
        "format": "jpg",
        "bytes": 245678,
        "originalFilename": "label-design.jpg"
      }
    ],
    "store": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Green Valley Dispensary",
      "address": "123 Main St",
      "city": "Los Angeles"
    },
    "rep": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "items": [],
    "status": "submitted",
    "note": "First test order",
    "deliveryDate": null,
    "createdAt": "2025-12-28T10:30:00.000Z",
    "updatedAt": "2025-12-28T10:30:00.000Z"
  }
}
```

### Error Responses:

#### 400 - Invalid Product Type
```json
{
  "message": "Invalid product type. Must be \"BIOMAX\" or \"Rosin\""
}
```

#### 400 - Missing Flavor
```json
{
  "message": "Flavor is required"
}
```

#### 404 - Rep Not Found
```json
{
  "message": "Rep not found"
}
```

#### 404 - Store Not Found
```json
{
  "message": "Store not found"
}
```

#### 400 - Store Blocked
```json
{
  "message": "Store is blocked"
}
```

#### 500 - Upload Failed
```json
{
  "message": "Failed to upload label images",
  "error": "Cloudinary error details..."
}
```

---

## How to Get Test IDs

### Get a Rep ID:

**GET** `http://localhost:5000/api/reps`

Response:
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",  // ← Use this
      "name": "John Doe"
    }
  ]
}
```

### Get a Store ID:

**GET** `http://localhost:5000/api/stores`

Response:
```json
{
  "stores": [
    {
      "_id": "507f1f77bcf86cd799439012",  // ← Use this
      "name": "Green Valley Dispensary"
    }
  ]
}
```

---

## Viewing Private Label Orders

Private label orders will appear in the regular orders list with `isPrivateLabel: true`

**GET** `http://localhost:5000/api/orders`

Response includes both regular and private label orders:
```json
{
  "orders": [
    {
      "_id": "...",
      "orderNumber": 1001,
      "isPrivateLabel": true,  // ← Private label order
      "privateLabelType": "BIOMAX",
      "flavor": "Strawberry Lemonade",
      "labelImages": [...],
      // ... rest of order data
    },
    {
      "_id": "...",
      "orderNumber": 1000,
      "isPrivateLabel": false,  // ← Regular order
      "items": [...],
      // ... rest of order data
    }
  ]
}
```

---

## File Upload Details

### Accepted File Types:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `application/pdf`

### File Size Limit:
- Maximum: 5MB per file

### Max Files:
- Up to 5 label images per order

### Storage:
- Files are uploaded to **Cloudinary**
- Stored in folder: `private-labels`
- Temporary files are auto-deleted after upload

### Cloudinary URLs:
- Regular URL: `http://res.cloudinary.com/dw7wk19yf/...`
- Secure URL: `https://res.cloudinary.com/dw7wk19yf/...` ← Use this one

---

## Testing Checklist

### Basic Tests:
- [ ] Create order with BIOMAX type
- [ ] Create order with Rosin type
- [ ] Create order with custom quantity
- [ ] Create order with delivery date
- [ ] Create order with discount
- [ ] Create order with note

### File Upload Tests:
- [ ] Upload 1 image (JPG)
- [ ] Upload 1 image (PNG)
- [ ] Upload 1 PDF
- [ ] Upload multiple images (3-5 files)
- [ ] Verify images appear in response
- [ ] Verify images are accessible via Cloudinary URL

### Validation Tests:
- [ ] Try invalid product type (should fail)
- [ ] Try empty flavor (should fail)
- [ ] Try invalid rep ID (should fail)
- [ ] Try invalid store ID (should fail)
- [ ] Try blocked store (should fail)
- [ ] Try file > 5MB (should fail)
- [ ] Try invalid file type (e.g., .exe) (should fail)

### Calculation Tests:
- [ ] Verify subtotal = quantity × unitPrice
- [ ] Verify total = subtotal - discount
- [ ] Test with BIOMAX pricing (45.00/unit)
- [ ] Test with Rosin pricing (55.00/unit)

### Integration Tests:
- [ ] Order appears in GET /api/orders
- [ ] Order has isPrivateLabel = true
- [ ] Store and Rep are populated
- [ ] Label images are accessible
- [ ] orderNumber auto-increments

---

## Common Issues & Solutions

### Issue: "Rep not found"
**Solution:** Make sure you're using a valid Rep ID from your database. Get one from `GET /api/reps`

### Issue: "Store not found"
**Solution:** Make sure you're using a valid Store ID from your database. Get one from `GET /api/stores`

### Issue: File upload not working
**Solution:**
- Make sure you selected **form-data** (not raw JSON)
- File fields should be type **File**, not **Text**
- Check file size is under 5MB

### Issue: "Invalid file type"
**Solution:** Only PNG, JPG, JPEG, and PDF files are allowed

### Issue: Cloudinary upload failed
**Solution:** Check that Cloudinary credentials in `.env` are correct:
```
CLOUDINARY_CLOUD_NAME=dw7wk19yf
CLOUDINARY_API_KEY=834373262156634
CLOUDINARY_API_SECRET=2S5r7VhpU8UiP_5ihJX3vEjcatY
```

---

## Sample cURL Command

```bash
curl -X POST http://localhost:5000/api/orders/private-label \
  -F "repId=507f1f77bcf86cd799439011" \
  -F "storeId=507f1f77bcf86cd799439012" \
  -F "privateLabelType=BIOMAX" \
  -F "flavor=Strawberry Lemonade" \
  -F "quantity=100" \
  -F "labelImages=@/path/to/label1.jpg" \
  -F "labelImages=@/path/to/label2.png"
```

---

## Next Steps

Once backend testing is complete:

1. ✅ Verify orders are created correctly
2. ✅ Verify files upload to Cloudinary
3. ✅ Verify calculations are accurate
4. ✅ Verify all validations work
5. → Move to frontend development

---

## Questions to Answer After Testing

1. **Pricing:** Are $45 (BIOMAX) and $55 (Rosin) the correct prices?
2. **Quantity:** Is 100 cases a good default quantity?
3. **Flavors:** Should flavors be free text or dropdown? If dropdown, what are the options?
4. **Label Upload:** Is 5 files enough? Should we allow more?
5. **File Types:** Do you need any other file types besides PNG/JPG/PDF?

---

**Last Updated:** 2025-12-28
**Backend Status:** ✅ Ready for Testing
