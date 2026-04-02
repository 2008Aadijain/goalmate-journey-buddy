## Plan: Matching, 1-on-1 Chat & Group Chat

### Database Schema (migrations)
1. **profiles** - user_id, name, goal_category, goal_label, goal_emoji, streak, created_at
2. **matches** - user1_id, user2_id, goal_category, status, created_at
3. **direct_messages** - sender_id, receiver_id, match_id, content, read, created_at
4. **group_messages** - sender_id, goal_category, content, created_at

### Auth
- Replace localStorage signup with real Supabase auth (email + password)
- Auto-create profile on signup with goal data

### Features
1. **Matching**: On dashboard load, find another user with same goal_category. Show their name + goal + streak. If none, show "Finding..." animation.
2. **1-on-1 Chat**: Simple text chat page between matched users. Unread badge on dashboard.
3. **Group Chat**: One chat room per goal category. All users in that category can send/read messages.

### Pages
- `/chat/:matchId` - Direct message page
- `/group-chat/:category` - Group chat page
- Update Dashboard to show match info + chat links + unread counts

### Design
- Same dark purple theme, glassmorphism cards
- Real-time updates via Supabase subscriptions
