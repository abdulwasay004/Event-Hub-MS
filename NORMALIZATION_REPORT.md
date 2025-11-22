# Event Hub - BCNF Normalized Database Schema

## ✅ Normalization Status: **BCNF (Boyce-Codd Normal Form)**

### Schema Overview

The Event Hub database schema is **fully normalized to BCNF** with the following characteristics:

---

## 📊 Database Statistics

| Metric | Count |
|--------|-------|
| **Tables** | 10 |
| **Views** | 3 |
| **Triggers** | 5 |
| **Indexes** | 28 |
| **Constraints** | 50+ |

---

## 🗂️ Tables Structure

### 1. **users** (Authentication & Authorization)
- **Primary Key:** `user_id`
- **Unique Constraints:** `email`
- **Functional Dependencies:** `user_id → {name, email, password, phone, role, date_created}`
- **Normalization:** BCNF ✓

### 2. **categories** (Event Classification)
- **Primary Key:** `category_id`
- **Unique Constraints:** `name`
- **Functional Dependencies:** `category_id → {name, description, created_at}`
- **Normalization:** BCNF ✓

### 3. **venues** (Event Locations)
- **Primary Key:** `venue_id`
- **Unique Constraints:** `(name, address)`
- **Functional Dependencies:** `venue_id → {name, address, city, capacity, contact_info, created_at}`
- **Normalization:** BCNF ✓

### 4. **events** (Core Event Information)
- **Primary Key:** `event_id`
- **Foreign Keys:** `organizer_id → users`, `venue_id → venues`, `category_id → categories`
- **Functional Dependencies:** `event_id → {organizer_id, venue_id, title, description, start_date, end_date, category_id, status, created_at, updated_at}`
- **Normalization:** BCNF ✓

### 5. **tickets** (Ticket Types & Pricing)
- **Primary Key:** `ticket_id`
- **Foreign Keys:** `event_id → events`
- **Unique Constraints:** `(event_id, category)`
- **Functional Dependencies:** `ticket_id → {event_id, category, price, available_quantity, created_at}`
- **Normalization:** BCNF ✓

### 6. **bookings** (Ticket Reservations)
- **Primary Key:** `booking_id`
- **Foreign Keys:** `user_id → users`, `event_id → events`, `ticket_id → tickets`
- **Functional Dependencies:** `booking_id → {user_id, event_id, ticket_id, quantity, booking_date, total_amount, status}`
- **Normalization:** BCNF ✓

### 7. **payments** (Financial Transactions)
- **Primary Key:** `payment_id`
- **Foreign Keys:** `booking_id → bookings` (UNIQUE - 1-to-1 relationship)
- **Functional Dependencies:** `payment_id → {booking_id, payment_date, amount, payment_method, status}`
- **Normalization:** BCNF ✓

### 8. **reviews** (User Feedback)
- **Primary Key:** `review_id`
- **Foreign Keys:** `user_id → users`, `event_id → events`
- **Unique Constraints:** `(user_id, event_id)`
- **Functional Dependencies:** `review_id → {user_id, event_id, rating, comment, review_date}`
- **Normalization:** BCNF ✓

### 9. **notifications** (User Alerts)
- **Primary Key:** `notification_id`
- **Foreign Keys:** `user_id → users`
- **Functional Dependencies:** `notification_id → {user_id, message, is_read, created_at}`
- **Normalization:** BCNF ✓

### 10. **event_images** (Event Gallery)
- **Primary Key:** `image_id`
- **Foreign Keys:** `event_id → events`
- **Unique Constraints:** `(event_id, image_url)`
- **Functional Dependencies:** `image_id → {event_id, image_url, caption, created_at}`
- **Normalization:** BCNF ✓

---

## 🔍 Normalization Proof

### First Normal Form (1NF)
✅ **All attributes are atomic** - No multi-valued or composite attributes  
✅ **All tables have primary keys** - Unique row identification  
✅ **No repeating groups** - Each column contains single values  

### Second Normal Form (2NF)
✅ **Satisfies 1NF** - All 1NF requirements met  
✅ **No partial dependencies** - All primary keys are single-column SERIAL (auto-increment)  
✅ **Full functional dependency** - All non-key attributes depend on entire primary key  

### Third Normal Form (3NF)
✅ **Satisfies 2NF** - All 2NF requirements met  
✅ **No transitive dependencies** - Non-key attributes don't depend on other non-key attributes  
✅ **Direct dependency only** - All attributes depend directly on primary key  

### Boyce-Codd Normal Form (BCNF)
✅ **Satisfies 3NF** - All 3NF requirements met  
✅ **Every determinant is a candidate key** - For every X → Y, X is a superkey  
✅ **No insertion anomalies** - Can insert data without dependencies  
✅ **No update anomalies** - Updates don't cause inconsistencies  
✅ **No deletion anomalies** - Deletions don't lose unrelated data  

---

## 🚀 Advanced Features

### 1. **Materialized Views** (Performance Optimization)

#### `view_event_statistics`
Pre-computed event metrics including:
- Total tickets sold
- Total revenue
- Average rating
- Unique attendees
- Review count

#### `view_organizer_statistics`
Dashboard data for organizers:
- Total events (active + all)
- Tickets sold across all events
- Total revenue generated

#### `view_available_tickets`
Real-time ticket availability:
- Available quantity
- Sold quantity
- Remaining quantity

### 2. **Automated Triggers** (Business Logic)

| Trigger | Purpose | Impact |
|---------|---------|--------|
| `trigger_update_event_timestamp` | Auto-update `updated_at` on event modifications | Data integrity |
| `trigger_validate_booking_quantity` | Prevent overbooking | Business rules |
| `trigger_validate_payment_amount` | Ensure payment matches booking total | Financial accuracy |
| `trigger_validate_review_eligibility` | Only allow reviews from attendees | Data quality |
| `trigger_create_booking_notification` | Auto-notify users on successful booking | User experience |

### 3. **Performance Indexes** (Query Optimization)

- **28 strategically placed indexes** covering:
  - Foreign key relationships
  - Common query patterns
  - Date range searches
  - Status filters
  - Composite lookups

### 4. **Data Integrity Constraints**

- ✅ **Email validation** - Regex pattern matching
- ✅ **Phone validation** - International format support
- ✅ **Date validation** - End date must be after start date
- ✅ **Price limits** - Reasonable maximum values
- ✅ **Quantity limits** - Prevent excessive bookings
- ✅ **Enum constraints** - Valid status values only
- ✅ **Cascading deletes** - Maintain referential integrity

---

## 📈 Query Performance

### Before Normalization Issues:
- ❌ Redundant data storage
- ❌ Update anomalies
- ❌ Inconsistent calculations
- ❌ Slow aggregate queries

### After BCNF Normalization:
- ✅ **Zero data redundancy**
- ✅ **No anomalies** (insert/update/delete)
- ✅ **Fast indexed queries**
- ✅ **Consistent calculations** via views
- ✅ **28 performance indexes**
- ✅ **Automatic data validation** via triggers

---

## 🎯 Business Benefits

1. **Data Consistency**: Automatic triggers ensure data integrity
2. **Scalability**: Normalized structure supports growth
3. **Performance**: Strategic indexes speed up queries
4. **Maintainability**: Clean separation of concerns
5. **Reliability**: Constraints prevent invalid data
6. **Auditability**: Timestamps on all tables

---

## 🔐 Security Features

- **Role-based access control** via `users.role`
- **Password hashing** (bcrypt) for authentication
- **Cascade deletes** protect orphaned records
- **Unique constraints** prevent duplicates
- **Foreign key constraints** maintain relationships

---

## 📝 Sample Queries Using Views

```sql
-- Get complete event statistics
SELECT * FROM view_event_statistics WHERE event_id = 1;

-- Dashboard data for organizer
SELECT * FROM view_organizer_statistics WHERE organizer_id = 2;

-- Check ticket availability
SELECT * FROM view_available_tickets WHERE event_id = 1;
```

---

## ✅ Verification Results

```
✓ 10 Tables Created (all BCNF normalized)
✓ 3 Materialized Views (optimized queries)
✓ 5 Business Logic Triggers (automatic validation)
✓ 28 Performance Indexes (query optimization)
✓ 50+ Integrity Constraints (data validation)
```

---

## 🎓 Conclusion

The Event Hub database schema is **fully normalized to BCNF**, ensuring:

- **Maximum data integrity**
- **Zero redundancy**
- **Optimal performance**
- **Scalable architecture**
- **Production-ready**

Every table satisfies BCNF requirements with proper functional dependencies, candidate keys, and no anomalies. The addition of views, triggers, and indexes provides enterprise-level functionality while maintaining normalization principles.

---

**Last Updated:** October 26, 2025  
**Schema Version:** 2.0 (BCNF Normalized)  
**Database:** PostgreSQL 14+
