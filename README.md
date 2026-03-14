# CoreInventory – Inventory Management System

CoreInventory is a modular **Inventory Management System (IMS)** designed to digitize and streamline stock-related operations within a business.
It replaces manual registers, spreadsheets, and scattered tracking systems with a **centralized, real-time web application**.

This project is built as part of the **Odoo Indus Hackathon**.

---

# 📦 Problem Overview

Businesses often manage inventory using Excel sheets or manual registers, which leads to:

* Data inconsistencies
* Lack of real-time tracking
* Difficulty in monitoring stock movement
* Errors in manual stock counting

CoreInventory solves these problems by providing a **single platform to manage products, stock movement, warehouses, and deliveries efficiently**.

---

# 👥 Target Users

### Inventory Managers

Responsible for monitoring and controlling stock operations.

Features available:

* Manage products
* Track stock movement
* Monitor warehouse inventory
* Validate receipts and deliveries

### Warehouse Staff

Responsible for operational activities.

Features available:

* Receive incoming goods
* Pick and pack orders
* Perform internal transfers
* Conduct stock counting

---

# 🔐 Authentication

The system includes secure authentication features:

* User signup and login
* OTP-based password reset
* Secure session handling
* Role-based access control

After authentication, users are redirected to the **Inventory Dashboard**.

---

# 📊 Dashboard

The dashboard provides a **quick overview of inventory activity**.

### Key Performance Indicators (KPIs)

* Total Products in Stock
* Low Stock / Out of Stock Items
* Pending Receipts
* Pending Deliveries
* Scheduled Internal Transfers

### Dynamic Filters

Users can filter operations by:

* Document Type

  * Receipts
  * Deliveries
  * Internal Transfers
  * Adjustments

* Status

  * Draft
  * Waiting
  * Ready
  * Done
  * Cancelled

* Warehouse / Location

* Product Category

---

# 🧩 Core Modules

## Product Management

Manage all inventory items.

Features:

* Create and update products
* Assign SKU codes
* Categorize products
* Define unit of measure
* Set initial stock

---

## Receipts (Incoming Goods)

Used when stock arrives from suppliers.

Process:

1. Create a receipt
2. Add supplier and products
3. Enter quantities received
4. Validate receipt

Stock automatically **increases after validation**.

Example:

Receive **50 units of Steel Rod**

Stock: `+50`

---

## Delivery Orders (Outgoing Goods)

Used when products are shipped to customers.

Process:

1. Pick items
2. Pack items
3. Validate delivery

Stock automatically **decreases after delivery validation**.

Example:

Deliver **10 chairs**

Stock: `-10`

---

## Internal Transfers

Move products between warehouse locations.

Examples:

* Main Warehouse → Production Floor
* Rack A → Rack B
* Warehouse 1 → Warehouse 2

Total stock remains the **same**, but the **location changes**.

---

## Stock Adjustments

Used to correct differences between **system stock and physical stock**.

Example:

System stock: `100`
Physical count: `97`

Adjustment: `-3`

All changes are recorded in the **Stock Ledger**.

---

# 🔄 Inventory Flow Example

Example workflow inside the system:

### Step 1 – Receive Goods

Receive `100 kg Steel`

Stock: `+100`

### Step 2 – Internal Transfer

Move steel to production rack

Stock unchanged
Location updated

### Step 3 – Deliver Goods

Deliver `20 kg Steel`

Stock: `-20`

### Step 4 – Damage Adjustment

`3 kg Steel` damaged

Stock: `-3`

Every operation is recorded in the **inventory ledger for tracking and auditing**.

---

# 🏗 System Architecture

```
Frontend
HTML + CSS + JavaScript

Backend
Node.js (Express.js)

Database
MySQL
```

The system follows a **separated frontend-backend architecture**.

---

# 📁 Project Structure

## Backend

```
backend
│
├── config
│   └── db.js
│
├── controllers
│   ├── authController.js
│   ├── productController.js
│   ├── receiptController.js
│   ├── deliveryController.js
│   ├── transferController.js
│   └── adjustmentController.js
│
├── routes
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── receiptRoutes.js
│   ├── deliveryRoutes.js
│   └── transferRoutes.js
│
├── models
│   ├── userModel.js
│   ├── productModel.js
│   ├── warehouseModel.js
│   ├── stockLedgerModel.js
│
├── middleware
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│
├── services
│   └── stockService.js
│
├── utils
│   └── otpService.js
│
├── app.js
└── server.js
```

---

## Frontend

```
frontend
│
├── css
│   └── styles.css
│
├── js
│   ├── api.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── products.js
│   ├── receipts.js
│   ├── deliveries.js
│   └── transfers.js
│
├── pages
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── receipts.html
│   ├── deliveries.html
│   ├── transfers.html
│   └── settings.html
│
└── index.html
```

---

# 🗄 Database Design

Main database tables:

* users
* products
* categories
* warehouses
* locations
* receipts
* receipt_items
* deliveries
* delivery_items
* transfers
* transfer_items
* stock_adjustments
* stock_ledger

The **stock ledger** records every movement of inventory.

---

# 🚀 Features

* Product and category management
* Real-time inventory tracking
* Multi-warehouse support
* Stock movement history
* Low stock alerts
* Smart search using SKU
* Inventory dashboard with KPIs

---

# 🛠 Tech Stack

Frontend

* HTML
* CSS
* JavaScript

Backend

* Node.js
* Express.js

Database

* MySQL

Tools

* GitHub
* Railway / Cloud Hosting
* REST APIs

---

# 🌟 Possible Enhancements

Future improvements may include:

* Barcode scanning
* Inventory analytics dashboard
* Email alerts for low stock
* Bulk product import
* Mobile-friendly UI
* Real-time notifications

---

# 👨‍💻 Team

Developed for **Odoo Indus Hackathon**.

Team members can be added here.

---

# 📄 License

This project is developed for educational and hackathon purposes.
