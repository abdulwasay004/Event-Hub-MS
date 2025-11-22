# Event Hub - Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT HUB DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     USERS        │
├──────────────────┤
│ PK user_id       │
│    name          │
│    email (UQ)    │
│    password      │
│    phone         │
│    role          │
│    created_at    │
└──────────────────┘
        │
        │ (organizer_id)
        ├─────────────────────────────────────────────┐
        │                                             │
        │ (user_id)                                   │
        ├──────────────────────┐                     │
        │                      │                     │
        │                      │                     │
        ▼                      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   NOTIFICATIONS  │  │     REVIEWS      │  │     EVENTS       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ PK notif_id      │  │ PK review_id     │  │ PK event_id      │
│ FK user_id       │  │ FK user_id       │  │ FK organizer_id  │
│    message       │  │ FK event_id      │  │ FK venue_id      │
│    is_read       │  │    rating        │  │ FK category_id   │
│    created_at    │  │    comment       │  │    title         │
└──────────────────┘  │    created_at    │  │    description   │
                      └──────────────────┘  │    start_date    │
                               │            │    end_date      │
                               │            │    status        │
                               │            │    created_at    │
                               │            │    updated_at    │
                               │            └──────────────────┘
                               │                     │
                               │                     │ (event_id)
                               │                     ├──────────────────┐
                               └─────────────────────┤                  │
                                                     │                  │
                                                     ▼                  ▼
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│   CATEGORIES     │          │   EVENT_IMAGES   │  │     TICKETS      │
├──────────────────┤          ├──────────────────┤  ├──────────────────┤
│ PK category_id   │◄─────────│ PK image_id      │  │ PK ticket_id     │
│    name (UQ)     │          │ FK event_id      │  │ FK event_id      │
│    description   │          │    image_url     │  │    category      │
│    created_at    │          │    caption       │  │    price         │
└──────────────────┘          │    uploaded_at   │  │    avail_qty     │
                              └──────────────────┘  │    created_at    │
                                                    └──────────────────┘
                                                             │
┌──────────────────┐                                        │ (ticket_id)
│     VENUES       │                                        │
├──────────────────┤                                        │
│ PK venue_id      │◄───────────────────────────────────────┤
│    name          │                                        │
│    address       │                                        │
│    city          │                                        ▼
│    capacity      │                              ┌──────────────────┐
│    contact_info  │                              │     BOOKINGS     │
│    created_at    │                              ├──────────────────┤
└──────────────────┘                              │ PK booking_id    │
                                                  │ FK user_id       │
                                                  │ FK event_id      │
                                                  │ FK ticket_id     │
                                                  │    quantity      │
                                                  │    total_amount  │
                                                  │    status        │
                                                  │    booking_date  │
                                                  └──────────────────┘
                                                           │
                                                           │ (booking_id)
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │     PAYMENTS     │
                                                  ├──────────────────┤
                                                  │ PK payment_id    │
                                                  │ FK booking_id    │
                                                  │    amount        │
                                                  │    payment_method│
                                                  │    status        │
                                                  │    payment_date  │
                                                  └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USERS (1) ──── (N) EVENTS                                                │
│    - One user can organize many events                                      │
│    - Relationship: organizer_id in EVENTS references user_id in USERS       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. USERS (1) ──── (N) BOOKINGS                                              │
│    - One user can make many bookings                                        │
│    - Relationship: user_id in BOOKINGS references user_id in USERS          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. USERS (1) ──── (N) REVIEWS                                               │
│    - One user can write many reviews                                        │
│    - Relationship: user_id in REVIEWS references user_id in USERS           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. USERS (1) ──── (N) NOTIFICATIONS                                         │
│    - One user can receive many notifications                                │
│    - Relationship: user_id in NOTIFICATIONS references user_id in USERS     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. VENUES (1) ──── (N) EVENTS                                               │
│    - One venue can host many events                                         │
│    - Relationship: venue_id in EVENTS references venue_id in VENUES         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. CATEGORIES (1) ──── (N) EVENTS                                           │
│    - One category can have many events                                      │
│    - Relationship: category_id in EVENTS references category_id             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 7. EVENTS (1) ──── (N) TICKETS                                              │
│    - One event can have many ticket types                                   │
│    - Relationship: event_id in TICKETS references event_id in EVENTS        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 8. EVENTS (1) ──── (N) BOOKINGS                                             │
│    - One event can have many bookings                                       │
│    - Relationship: event_id in BOOKINGS references event_id in EVENTS       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 9. EVENTS (1) ──── (N) REVIEWS                                              │
│    - One event can have many reviews                                        │
│    - Relationship: event_id in REVIEWS references event_id in EVENTS        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 10. EVENTS (1) ──── (N) EVENT_IMAGES                                        │
│     - One event can have many images                                        │
│     - Relationship: event_id in EVENT_IMAGES references event_id            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 11. TICKETS (1) ──── (N) BOOKINGS                                           │
│     - One ticket type can be booked many times                              │
│     - Relationship: ticket_id in BOOKINGS references ticket_id in TICKETS   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 12. BOOKINGS (1) ──── (1) PAYMENTS                                          │
│     - One booking has one payment                                           │
│     - Relationship: booking_id in PAYMENTS references booking_id            │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            CARDINALITY SUMMARY
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────┬──────────────────┬───────────────────────────────────────┐
│   Parent Table   │   Child Table    │         Relationship Type             │
├──────────────────┼──────────────────┼───────────────────────────────────────┤
│ USERS            │ EVENTS           │ One-to-Many (as organizer)            │
│ USERS            │ BOOKINGS         │ One-to-Many (as customer)             │
│ USERS            │ REVIEWS          │ One-to-Many (reviewer)                │
│ USERS            │ NOTIFICATIONS    │ One-to-Many (recipient)               │
│ VENUES           │ EVENTS           │ One-to-Many (host)                    │
│ CATEGORIES       │ EVENTS           │ One-to-Many (classification)          │
│ EVENTS           │ TICKETS          │ One-to-Many (ticket types)            │
│ EVENTS           │ BOOKINGS         │ One-to-Many (reservations)            │
│ EVENTS           │ REVIEWS          │ One-to-Many (feedback)                │
│ EVENTS           │ EVENT_IMAGES     │ One-to-Many (gallery)                 │
│ TICKETS          │ BOOKINGS         │ One-to-Many (purchases)               │
│ BOOKINGS         │ PAYMENTS         │ One-to-One (transaction)              │
└──────────────────┴──────────────────┴───────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           KEY CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

PRIMARY KEYS (PK):
  • user_id, event_id, venue_id, category_id, ticket_id, booking_id, 
    payment_id, review_id, notification_id, image_id

FOREIGN KEYS (FK):
  • organizer_id → users.user_id
  • venue_id → venues.venue_id
  • category_id → categories.category_id
  • event_id → events.event_id
  • ticket_id → tickets.ticket_id
  • booking_id → bookings.booking_id
  • user_id → users.user_id

UNIQUE CONSTRAINTS (UQ):
  • users.email
  • categories.name

ON DELETE CASCADE:
  • All foreign keys cascade on delete to maintain referential integrity
```

## Database Normalization: BCNF (Boyce-Codd Normal Form)

✅ **1NF**: All attributes contain atomic values  
✅ **2NF**: No partial dependencies (all non-key attributes depend on entire primary key)  
✅ **3NF**: No transitive dependencies  
✅ **BCNF**: Every determinant is a candidate key

## Key Features:
- **Role-based Access Control**: Users can be 'admin', 'organizer', or 'user'
- **Event Management**: Comprehensive event lifecycle from creation to reviews
- **Booking System**: Supports multiple ticket types per event with quantity tracking
- **Payment Integration**: One-to-one relationship with bookings for financial tracking
- **Review System**: Users can review events they've attended
- **Notification System**: Keep users informed about their bookings and events
