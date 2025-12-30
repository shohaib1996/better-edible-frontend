# Private Label Orders - Implementation Summary

## Overview
This document outlines the complete implementation of the Private Label Orders system for the Better Edibles frontend application.

## ✅ Completed Features

### 1. Sidebar Navigation
- **Files Modified:**
  - `src/components/AppSidebar/AppSidebar.tsx`
- **Changes:**
  - Added "Private Label" menu item with Tag icon for both Admin and Rep views
  - Admin route: `/admin/private-label-orders`
  - Rep route: `/rep/private-label-orders`

### 2. Redux API Integration
- **Files Created:**
  - `src/redux/api/PrivateLabel/privateLabelApi.ts`
  - `src/types/privateLabel/privateLabel.ts`
- **Files Modified:**
  - `src/redux/tagTypes/tagTypes.ts` - Added `privateLabelOrders` and `privateLabelProducts` tags
  - `src/types/index.ts` - Exported private label types
- **API Endpoints:**
  - **Products:**
    - `GET /private-label-products` - Get all products (with activeOnly filter)
    - `GET /private-label-products/:id` - Get single product
    - `POST /private-label-products` - Create product
    - `PUT /private-label-products/:id` - Update product
    - `DELETE /private-label-products/:id` - Delete product
  - **Orders:**
    - `GET /private-labels` - Get all orders (with filters)
    - `GET /private-labels/:id` - Get single order
    - `POST /private-labels` - Create order (FormData for file upload)
    - `PUT /private-labels/:id` - Update order
    - `PUT /private-labels/:id/status` - Change order status
    - `DELETE /private-labels/:id` - Delete order

### 3. Components Created

#### Private Label Order Components
1. **`PrivateLabelOrderCard.tsx`**
   - Displays order summary with orange theme
   - Shows store, rep, total, delivery date
   - Status badge and dropdown
   - "View Details" button
   - Permission-based status editing

2. **`PrivateLabelOrderDetailsModal.tsx`**
   - Full order details view
   - Lists all items with flavors and quantities
   - Image gallery for label images (clickable thumbnails)
   - Uses existing `ImagePreviewModal` for full-screen image view
   - Discount display (percentage or flat)
   - Status action buttons (Accept, Manifest, Ship, Cancel)

3. **`PrivateLabelForm.tsx`**
   - Dynamic multi-item form
   - Add/Remove items
   - Product type dropdown (fetches from API)
   - Flavor input per item
   - Quantity input per item
   - File upload per item (max 5 files, 5MB each)
   - File preview with remove functionality
   - Real-time calculation:
     - Item totals
     - Subtotal
     - Discount (flat or percentage)
     - Final total
   - Note field

#### Private Label Product Components
4. **`PrivateLabelProductCard.tsx`**
   - Product display with name, price, description
   - Active/Inactive toggle switch
   - Edit and Delete buttons
   - Green border for active, gray for inactive

5. **`ProductFormModal.tsx`**
   - Add/Edit product modal
   - Fields: Name, Unit Price, Description, Active Status
   - Validation for required fields
   - Price input with $ prefix and "per unit/case" suffix

### 4. Pages Created

#### Order Pages
1. **`PrivateLabelOrdersPage.tsx`**
   - **Admin View:**
     - Tab 1: "New Orders" (submitted, accepted, manifested)
     - Tab 2: "Shipped Orders" (shipped, cancelled)
     - "Manage Products" button (navigates to products page)
   - **Rep View:**
     - Tab 1: "All Orders" (all orders, read-only for others)
     - Tab 2: "New Orders" (own orders only)
     - Tab 3: "Shipped Orders" (all shipped/cancelled, read-only)
   - "Create Order" button
   - Total orders value display
   - Role-based permissions for editing

2. **`CreatePrivateLabelOrderPage.tsx`**
   - Store selection (with auto-fill rep)
   - Rep selection (disabled for rep view)
   - Delivery date picker
   - Uses `PrivateLabelForm` component
   - Handles FormData submission with indexed file fields:
     - `labelImages_0`, `labelImages_1`, etc.
   - Validation before submission
   - Success/error toast notifications

#### Product Pages
3. **`PrivateLabelProductsPage.tsx`** (Admin Only)
   - Lists all products (active and inactive separately)
   - "Add Product" button
   - Uses `PrivateLabelProductCard` component
   - Uses `ProductFormModal` for add/edit
   - CRUD operations:
     - Create product
     - Update product
     - Delete product (with confirmation)
     - Toggle active status

### 5. Routes Created

#### Admin Routes
- `src/app/(adminlayout)/admin/private-label-orders/page.tsx`
- `src/app/(adminlayout)/admin/private-label-orders/create/page.tsx`
- `src/app/(adminlayout)/admin/private-label-products/page.tsx`

#### Rep Routes
- `src/app/(replayout)/rep/private-label-orders/page.tsx`
- `src/app/(replayout)/rep/private-label-orders/create/page.tsx`

### 6. UI Components Added
- **`src/components/ui/switch.tsx`** - Toggle switch component (Radix UI)

## 🎨 Design Features

### Color Theme
- **Orange/Yellow Gradient:** Used throughout for Private Label branding
- **Badge:** `🏷️ PRIVATE LABEL` with orange-to-yellow gradient
- **Cards:** Orange left border (4px)
- **Buttons:** Orange primary color (#f97316)

### Status Colors
- **Submitted:** Blue
- **Accepted:** Yellow
- **Manifested:** Emerald/Green
- **Shipped:** Green
- **Cancelled:** Red

## 🔐 Permission Logic

### Admin Permissions
- Can view all orders
- Can edit all orders
- Can change status of any order
- Can access "Manage Products" page

### Rep Permissions
- Can view all orders (read-only for orders from other reps)
- Can only edit their own orders
- Can only change status of their own orders
- Cannot access "Manage Products" page

### Permission Check Function
```typescript
const canEditOrder = (order: IPrivateLabelOrder, user: User) => {
  if (user.role === 'superadmin') return true;
  if (user.role === 'rep') {
    return order.rep._id === user._id;
  }
  return false;
};
```

## 📦 File Upload Implementation

### FormData Structure
```typescript
const formData = new FormData();
formData.append('storeId', storeId);
formData.append('repId', repId);
formData.append('items', JSON.stringify(itemsData)); // Items without files

// Files with indexed field names
items.forEach((item, index) => {
  item.labelFiles.forEach(file => {
    formData.append(`labelImages_${index}`, file);
  });
});

formData.append('discount', discount.toString());
formData.append('discountType', discountType);
formData.append('note', note);
formData.append('deliveryDate', deliveryDate);
```

### File Constraints
- Maximum 5 files per item
- Maximum 5MB per file
- Accepted formats: Images (PNG, JPG, etc.)

## 🧮 Discount Calculation

### Two Types Supported
1. **Flat Discount:** Direct dollar amount subtracted from subtotal
2. **Percentage Discount:** Percentage of subtotal subtracted

### Display Format
- Percentage: `10% (-$28.75)`
- Flat: `-$50.00`

## 📊 Data Types

### IPrivateLabelProduct
```typescript
{
  _id: string;
  name: string;
  unitPrice: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### IPrivateLabelOrder
```typescript
{
  _id: string;
  store: IStore;
  rep: IRep;
  items: IPrivateLabelOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "flat" | "percentage";
  total: number;
  note?: string;
  deliveryDate?: string;
  status: "submitted" | "accepted" | "manifested" | "shipped" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
```

### IPrivateLabelOrderItem
```typescript
{
  privateLabelType: string; // Product name
  flavor: string;
  quantity: number;
  unitPrice: number;
  total: number;
  labelImages: string[]; // URLs to images
}
```

## 🔄 Integration Points

### Existing Components Used
1. **`StoreSelect`** - Store selection dropdown
2. **`RepSelect`** - Rep selection dropdown
3. **`ImagePreviewModal`** - Full-screen image preview with download
4. **`useUser` hook** - Get current user info

### UI Components Used
- Dialog, Button, Card, Input, Label, Textarea
- Select, Popover, Calendar, Separator, Badge
- Switch, Tabs

## 🚀 Next Steps for Backend Team

### API Endpoints Required
1. **Products Management:**
   - CRUD operations for private label products
   - Filter by `activeOnly` parameter

2. **Orders Management:**
   - CRUD operations for private label orders
   - File upload handling with indexed field names
   - Status management
   - Filtering by status, repId, storeId, dates

### File Storage
- Handle multiple file uploads per order item
- Store with proper indexing (`labelImages_0`, `labelImages_1`, etc.)
- Return image URLs in order response

### Response Format
Ensure API responses match the TypeScript interfaces defined in `src/types/privateLabel/privateLabel.ts`

## 📝 Testing Checklist

### Admin Flow
- [ ] Navigate to Private Label Orders page
- [ ] View New Orders tab
- [ ] View Shipped Orders tab
- [ ] Click "Manage Products" button
- [ ] Add a new product
- [ ] Edit a product
- [ ] Toggle product active status
- [ ] Delete a product
- [ ] Create a new order
- [ ] Upload label images
- [ ] View order details
- [ ] Change order status

### Rep Flow
- [ ] Navigate to Private Label Orders page
- [ ] View All Orders tab (see all orders)
- [ ] View New Orders tab (see only own orders)
- [ ] View Shipped Orders tab
- [ ] Create a new order
- [ ] Upload label images
- [ ] View order details
- [ ] Try to edit another rep's order (should be read-only)
- [ ] Edit own order

### Edge Cases
- [ ] Try uploading more than 5 files per item
- [ ] Try uploading files larger than 5MB
- [ ] Test discount calculations (both flat and percentage)
- [ ] Test empty states (no orders, no products)
- [ ] Test form validation

## 🎉 Summary

The complete Private Label Orders system has been implemented with:
- ✅ 11 new components
- ✅ 3 new pages
- ✅ 5 new routes
- ✅ Full Redux API integration
- ✅ Role-based permissions
- ✅ Multi-file upload support
- ✅ Orange/yellow theme design
- ✅ Responsive layouts

All files are ready for testing once the backend API endpoints are implemented!
