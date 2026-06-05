# Architecture

## Data Flow

```
CSV Upload → Ingest Service → Shipment Created → Exception Detector → Case Opened
                                                                           │
                                                              ┌────────────┼───────────────┐
                                                         Exceptions    Events         Playbook
                                                          attached     logged         triggered
                                                                                          │
                                                                                     AI Actions
                                                                                    (email, tasks, escalate)
```

## Case Status Flow
```
OPEN → AI_RESOLVING → RESOLVED
                   → PENDING_HUMAN → ESCALATED → RESOLVED
```

## Event Log (append-only)
Events are the source of truth for the case timeline.
Never delete. Never mutate. Always append.
Event types use dot-notation: `exception.missed_pickup`, `carrier.emailed`, `case.escalated`
