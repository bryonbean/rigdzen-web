# Project Vision

## Project Overview

Rigdzen is a web application designed to support Buddhist retreat coordination and sangha community management. The platform serves as a companion to the Rigdzen mobile app, providing comprehensive administrative capabilities for retreat organizers while offering participants streamlined access to retreat services, schedules, and spiritual practice tracking.

The application addresses the logistical challenges of coordinating multi-day retreats for 20-40 participants, managing meal orders, tracking practice accumulations (Ngondro, Green Tara, and Vajrasattva), and facilitating community communication. Built for organizations like Orgyen Khamdroling and OKL Canada, Rigdzen transforms retreat coordination from ad-hoc coordination into a structured, scalable system.

## Project Goals

- We are building a web application that allows users to manage aspects of a retreat.
- The application will allow users to pay for services and products.
- The application will allow users to manage their account and profile.
- The application will allow users to receive their retreat responsibilities and notifications.
- The application will allow users to sign off on their retreat responsibilities and notifications.
- The application will have a calendar view of the retreat schedule.
- The application will allow admins to manage the retreat schedule and responsibilities.
- The application will allow admins to manage the users and their accounts.
- The application will allow admins to manage the services and products.
- The application will allow admins to manage the payments and invoices.
- The application will allow admins to manage the notifications and emails.
- The application will allow admins to manage the reports and analytics.
- The application will have an API for its mobile app.

## Project Constraints

**Technical Constraints:**
- Must provide RESTful API endpoints compatible with existing React Native mobile app architecture
- Must integrate with PayPal Standard checkout (existing business account integration)
- Must support Google Calendar API v3 integration for multi-calendar event aggregation
- Database must support practice accumulation tracking with goal progress calculations
- Must handle offline/online synchronization for mobile app data

**Business Constraints:**
- Non-profit model: cost-splitting among community members, not profit-generating
- Payment processing limited to PayPal (no additional payment gateway integration initially)
- Target user base: 20-40 participants per retreat, primarily Canadian users
- Budget constraints: minimal hosting and infrastructure costs
- Timeline: iterative development aligned with retreat schedule needs

**User Experience Constraints:**
- Must accommodate users with varying technical literacy (dharma practitioners of all ages)
- Mobile app remains primary interface for participants; web app focuses on admin capabilities
- Must respect Buddhist practice context (appropriate terminology, mindful design)
- Accessibility considerations for retreat environments (potentially limited internet connectivity)

**Regulatory Constraints:**
- Must comply with Canadian payment processing regulations
- Must handle personal data in accordance with privacy legislation
- Must provide transparent cost-splitting (not commercial transactions)

## Project Success Criteria

**User Adoption Metrics:**
- 80%+ of retreat participants actively use the platform for meal ordering within first 3 retreats
- 90%+ of retreat organizers prefer Rigdzen over manual coordination methods
- Mobile app maintains 4.0+ star rating with positive feedback on core features

**Operational Efficiency:**
- Reduce retreat coordination time by 50% compared to manual email/spreadsheet methods
- Process meal orders for 40 participants in under 5 minutes
- Zero payment reconciliation errors across retreat events
- Calendar synchronization with 99%+ accuracy

**Technical Performance:**
- API response times under 200ms for 95th percentile requests
- Mobile app successfully syncs with web backend in under 3 seconds
- Zero data loss incidents for practice accumulations or payment records
- 99.5%+ uptime during retreat periods

**Financial Goals:**
- Successfully process $1,000+ CAD per retreat with accurate cost-splitting
- Zero disputes or payment processing failures
- Transparent reporting of all costs to participants

**Community Impact:**
- Positive feedback from sangha members on retreat experience improvement
- Increased retreat attendance due to simplified logistics
- Enhanced practice tracking engagement among community members

## Project User Stories

**Retreat Participant Stories:**
- As a retreat participant, I want to view the retreat schedule so I can plan my attendance and preparation
- As a participant, I want to order lunch selections and pay my share so I can contribute to group meals
- As a participant, I want to track my practice accumulations so I can monitor my progress toward completion goals
- As a participant, I want to receive notifications about my retreat responsibilities so I don't miss important tasks
- As a participant, I want to confirm I've completed my assigned duties so organizers know tasks are done
- As a participant, I want to update my dietary restrictions so meal orders accommodate my needs
- As a participant, I want to view my payment history so I can track my retreat-related expenses

**Retreat Organizer/Admin Stories:**
- As a retreat organizer, I want to create and manage retreat schedules so participants know the program
- As an organizer, I want to assign responsibilities to participants so all retreat tasks are covered
- As an organizer, I want to manage meal orders and track payments so I can coordinate catering accurately
- As an organizer, I want to send notifications to specific participant groups so I can communicate efficiently
- As an organizer, I want to view attendance and payment reports so I can reconcile retreat finances
- As an organizer, I want to manage the retreat menu and pricing so costs reflect actual catering expenses
- As an organizer, I want to integrate multiple calendar sources so all community events are visible in one place
- As an organizer, I want to export participant lists with contact information so I can communicate outside the app
- As an organizer, I want to track who has confirmed their responsibilities so I know what still needs coverage

**Mobile App User Stories:**
- As a mobile app user, I want my practice counts to sync with the web platform so my data is always backed up
- As a mobile app user, I want to access my data offline during retreats so poor connectivity doesn't block my practice tracking
- As a mobile app user, I want to receive push notifications about retreat updates so I stay informed on the go

## Project User Journeys

**Journey 1: Retreat Registration and Meal Ordering**
1. Participant receives email notification about upcoming weekend retreat
2. Participant logs into Rigdzen web app and navigates to retreat calendar
3. Participant views retreat details, schedule, and meal options
4. Participant selects lunch preferences for Saturday and Sunday ($35 CAD each)
5. Participant proceeds to PayPal checkout and completes payment
6. Participant receives order confirmation via email with receipt
7. Organizer receives notification of new order and payment
8. Day before retreat, participant receives reminder notification with schedule and their meal selections

**Journey 2: Practice Accumulation Tracking (Mobile-Web Sync)**
1. Participant completes morning Ngondro practice session at home
2. Participant opens mobile app and increments Ngondro count by 100
3. Mobile app saves data locally and syncs with web backend when online
4. Later, participant logs into web app on desktop to review progress
5. Web app displays current accumulation with progress toward 100,000 goal
6. Participant shares milestone achievement (50,000 completed) with dharma friends
7. Organizer views community-wide practice statistics for sangha meeting discussion

**Journey 3: Retreat Coordination (Organizer Perspective)**
1. Organizer creates new retreat event in web admin panel with dates and location
2. Organizer uploads retreat schedule with teaching sessions and break times
3. Organizer creates meal ordering period (opens 2 weeks before, closes 3 days before retreat)
4. Organizer assigns retreat responsibilities (shrine setup, tea service, clean-up) to participants
5. Participants receive notification emails and confirm assignments in web app
6. Organizer reviews meal orders and sends final headcount to caterer
7. During retreat, organizer checks responsibility completion status on mobile
8. After retreat, organizer exports payment report for financial reconciliation
9. Organizer sends thank-you message to all participants through notification system

**Journey 4: Calendar Integration for Multi-Organization Events**
1. Sangha member opens Rigdzen calendar view to plan monthly attendance
2. Calendar displays color-coded events from both Orgyen Khamdroling and OKL Canada feeds
3. Member filters to show only weekend retreats in next 3 months
4. Member clicks on specific retreat to view detailed description and registration status
5. Member sees meal ordering deadline and current registration count
6. Member adds retreat to personal calendar via export function
7. Member receives automated reminder 1 week before retreat begins

**Journey 5: First-Time User Onboarding**
1. New sangha member receives invitation link from organizer
2. User creates account with email, password, and basic profile (name, dietary restrictions)
3. User completes onboarding tutorial explaining key features (calendar, meal orders, practice tracking)
4. User downloads mobile app and logs in with same credentials
5. User explores practice tracker and sets initial goals for Ngondro practice
6. User browses upcoming retreat calendar and registers for first event
7. User receives welcome email with community guidelines and support contact