# Database Schema / Model Definitions

This project uses MongoDB with Mongoose.

## `User` Model

Collection: `users`

| Field | Type | Required | Constraints / Notes |
|---|---|---|---|
| `email` | `String` | Yes | Unique, indexed, lowercased, trimmed |
| `passwordHash` | `String` | Yes | Stored as `salt:hash` (PBKDF2) |
| `authTokenHash` | `String` | No | SHA-256 hash of active session token |
| `authTokenExpiresAt` | `Date` | No | Session expiry timestamp |
| `createdAt` | `Date` | Auto | Added by `timestamps: true` |
| `updatedAt` | `Date` | Auto | Added by `timestamps: true` |

Indexes:
- `email` unique index
- `email` standard index

## `Content` Model

Collection: `contents`

| Field | Type | Required | Constraints / Notes |
|---|---|---|---|
| `uniqueId` | `String` | Yes | Unique, indexed share identifier |
| `type` | `String` | Yes | Enum: `text` or `file` |
| `content` | `String` | Conditional | Required when `type === "text"` |
| `fileUrl` | `String` | Conditional | Required when `type === "file"` |
| `fileName` | `String` | No | Original uploaded filename |
| `fileSize` | `Number` | No | Bytes |
| `mimeType` | `String` | No | Uploaded file MIME type |
| `createdAt` | `Date` | Auto | Defaults to current time |
| `expiresAt` | `Date` | Yes | Indexed expiry timestamp |
| `viewCount` | `Number` | Auto | Defaults to `0` |
| `maxViews` | `Number` | No | `null` means unlimited |
| `password` | `String` | No | Optional vault password hash |
| `oneTimeView` | `Boolean` | Auto | Defaults to `false` |
| `deleteToken` | `String` | No | Token used for delete flow |
| `ownerId` | `ObjectId` | No | Ref to `User`, indexed |
| `allowedUserEmails` | `[String]` | No | Optional allowlist |

Indexes:
- `uniqueId` unique index
- `expiresAt` index
- `ownerId` index

Behavioral model methods:
- `isExpired()` returns whether the record is past `expiresAt`.
- `canView()` enforces expiry and `maxViews`.
- A pre-find hook filters out expired records on find operations.
