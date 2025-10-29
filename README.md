# Gate Pass Management System

## Project Title
**Blockchain-Based Gate Pass Management System**

A decentralized gate pass management platform built on Stellar's Soroban smart contract platform that enables secure, transparent, and efficient pass creation, approval, and expiration tracking.

---

## Project Description

This project is a blockchain-based gate pass management system that leverages Soroban smart contracts to create a transparent and immutable pass tracking solution. The system enables users to create gate passes, allows administrators to approve them, and provides real-time status tracking for all passes in the system.

The smart contract ensures that:
- Users can create gate passes with title and description
- Each pass is assigned a unique identifier for tracking
- Administrators can approve pending passes
- Users can expire their approved passes when exiting
- Complete transparency of pass statistics (approved, pending, expired, total)
- All pass data is stored immutably on the blockchain

This dApp eliminates manual pass management inefficiencies and provides a trustless environment where pass records are guaranteed by blockchain technology. It's ideal for organizations, campuses, residential complexes, and corporate facilities.

---

## Project Vision

Our vision is to modernize access control systems by making them more transparent, efficient, and secure. By leveraging blockchain technology, we aim to:

- **Eliminate Paper-Based Systems**: Replace manual gate pass registers with digital blockchain records
- **Increase Accountability**: Create immutable audit trails for all pass activities
- **Enhance Security**: Prevent pass forgery and unauthorized access through cryptographic verification
- **Improve Efficiency**: Automate pass approval workflows and reduce processing time
- **Enable Real-Time Tracking**: Provide instant visibility into pass status and statistics
- **Build Trust**: Create a system where all stakeholders can verify pass authenticity

We envision a future where all access control systems—from office buildings to gated communities—leverage blockchain technology for secure, transparent, and efficient pass management.

---

## Key Features

### 1. **Create Pass**
- Users can create new gate passes with title and description
- Automatically assigns unique pass ID to each pass
- Records pass creation timestamp on blockchain
- Increments total and pending pass counters
- Prevents duplicate pass creation by same user
- All pass data stored immutably on blockchain

### 2. **Approve Pass**
- Administrators can approve pending passes
- Records approval timestamp (out-time)
- Updates pass status from pending to approved
- Automatically updates approval statistics
- Prevents approval of already-approved or non-existent passes
- Maintains separate admin control records

### 3. **Expire Pass**
- Users can expire their approved passes when leaving
- Records pass expiration timestamp (in-time)
- Updates pass status to expired
- Increments expired pass counter
- Prevents expiration of unapproved or already-expired passes
- Calculates total time duration between approval and expiration

### 4. **View All Pass Status**
- Displays comprehensive pass statistics dashboard
- Shows count of approved passes
- Shows count of pending passes awaiting approval
- Shows count of expired passes
- Shows total number of passes created in the system
- Real-time updates as pass statuses change

### 5. **View Pass Details**
- Users can view their pass details using unique pass ID
- Displays title, description, creation time, and expiry time
- Shows current pass status (active/expired)
- Separate views for user-controlled and admin-controlled data
- Transparent access to all pass information

### 6. **Blockchain Security & Transparency**
- All pass records stored on Stellar blockchain
- Immutable pass history and audit trails
- Cryptographic verification of pass authenticity
- Transparent and verifiable pass lifecycle
- Extended TTL (Time To Live) for data persistence

---

## Future Scope

### Short-term Enhancements
1. **QR Code Generation**: Generate unique QR codes for each pass for quick verification
2. **Visitor Information**: Add fields for visitor name, contact number, and ID proof
3. **Host Information**: Link passes to host employees or residents
4. **Vehicle Details**: Add vehicle number and type for parking management
5. **Pass Templates**: Pre-defined pass types (visitor, vendor, delivery, emergency)
6. **Rejection Functionality**: Allow admins to reject passes with reason

### Medium-term Enhancements
1. **Time-Based Auto-Expiry**: Automatically expire passes after specified duration
2. **Notification System**: Alert users and admins about pass status changes
3. **Multi-Level Approval**: Implement hierarchical approval workflows
4. **Pass Categories**: Different pass types with varying permissions
5. **Search and Filter**: Advanced search by date, status, title, or ID
6. **Bulk Operations**: Approve or expire multiple passes simultaneously
7. **Analytics Dashboard**: Visual charts for pass trends and patterns
8. **Access Zones**: Define which areas each pass can access
9. **Recurring Passes**: Support for daily/weekly/monthly recurring passes
10. **Emergency Override**: Special admin privileges for emergency situations

### Long-term Vision
1. **Mobile Application**: Native iOS and Android apps with QR scanning
2. **IoT Integration**: Connect with smart gates and turnstiles for automatic access control
3. **Facial Recognition**: Integrate biometric verification for enhanced security
4. **AI-Powered Anomaly Detection**: Identify suspicious pass patterns
5. **Cross-Organization Network**: Share pass data between trusted organizations
6. **Blockchain Interoperability**: Support multiple blockchain networks
7. **Government ID Integration**: Verify visitor identity against government databases
8. **Visitor Pre-Registration**: Allow hosts to pre-register visitors online
9. **Geofencing**: Location-based pass activation and expiration
10. **Compliance Reporting**: Generate regulatory compliance reports
11. **Integration with HR Systems**: Sync with employee databases
12. **Guest Wi-Fi Access**: Automatically grant Wi-Fi access to pass holders
13. **Payment Integration**: Collect fees for certain pass types
14. **Emergency Contact System**: Store and access emergency contact information
15. **Multi-Language Support**: Interface available in multiple languages

---

## Technical Stack

- **Smart Contract Platform**: Soroban (Stellar)
- **Programming Language**: Rust
- **SDK**: Soroban SDK
- **Blockchain**: Stellar Network
- **Storage**: Instance Storage with Extended TTL

---

## Contract Architecture

### Data Structures

**ApprovalStatus**
- `approved`: Count of approved passes
- `pending`: Count of pending passes
- `expired`: Count of expired passes
- `total`: Total passes created

**Pass**
- `unique_id`: Unique identifier for the pass
- `title`: Pass title
- `descrip`: Pass description
- `crt_time`: Pass creation timestamp
- `in_time`: Pass entry/expiration timestamp
- `isexpired`: Boolean flag for expiry status

**Admincontrol**
- `ac_id`: Unique ID for admin control record
- `out_time`: Pass approval/exit timestamp
- `approval`: Boolean approval status

---

## Getting Started

### Prerequisites
- Rust toolchain (1.70.0 or later)
- Soroban CLI tools installed
- Stellar account for deployment
- Basic understanding of Soroban smart contracts

### Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked soroban-cli

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Clone the repository
git clone <repository-url>
cd gate-pass-contract

# Build the contract
soroban contract build

# Optimize the WASM (optional)
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/gate_pass_contract.wasm
```

### Deployment

```bash
# Deploy to Testnet
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/gate_pass_contract.wasm \
    --source <YOUR_SECRET_KEY> \
    --network testnet

# The command will return a CONTRACT_ID - save this for future interactions
```

---

## Usage Examples

### Create a New Pass

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --source <USER_SECRET_KEY> \
    --network testnet \
    -- \
    create_pass \
    --title "Visitor Pass" \
    --descrip "Meeting with John Doe"
```

### Approve a Pass (Admin)

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --source <ADMIN_SECRET_KEY> \
    --network testnet \
    -- \
    approve_pass \
    --ac_id 1
```

### Expire a Pass

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --source <USER_SECRET_KEY> \
    --network testnet \
    -- \
    expire_pass \
    --unique_id 1
```

### View All Pass Statistics

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --network testnet \
    -- \
    view_all_pass_status
```

### View Specific Pass Details

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --network testnet \
    -- \
    view_my_pass \
    --uniqueid 1
```

### View Admin Control Data

```bash
soroban contract invoke \
    --id <CONTRACT_ID> \
    --network testnet \
    -- \
    view_ac_pass_by_unique_id \
    --unique_id 1
```

---

## Pass Lifecycle

```
1. User Creates Pass (Pending Status)
           ↓
2. Admin Reviews Pass
           ↓
3. Admin Approves Pass (Approved Status)
           ↓
4. User Enters Premises
           ↓
5. User Exits Premises
           ↓
6. User Expires Pass (Expired Status)
```

---

## Security Considerations

- **Single Active Pass**: Users can only have one active pass at a time
- **Immutable Records**: All pass data is permanently stored on blockchain
- **Timestamp Verification**: All actions are timestamped for audit trails
- **Access Control**: Separate functions for users and administrators
- **Data Validation**: Comprehensive checks before state changes
- **Storage Optimization**: Extended TTL ensures data persistence

---

## Use Cases

### Corporate Offices
- Visitor management for meetings and interviews
- Vendor and delivery personnel tracking
- Temporary employee access control

### Educational Institutions
- Campus visitor passes
- Parent-teacher meeting registration
- Guest lecturer access management

### Residential Communities
- Guest and visitor tracking
- Service provider access (plumber, electrician, etc.)
- Delivery personnel management

### Healthcare Facilities
- Patient visitor management
- Medical representative tracking
- Vendor and supplier access control

### Government Buildings
- Citizen appointment tracking
- Contractor access management
- Audit trail for security compliance

---

## Testing

```bash
# Run tests
cargo test

# Run with coverage
cargo tarpaulin --out Html

# Deploy to local network for testing
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/gate_pass_contract.wasm \
    --network local
```

---

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the Repository**: Create your own fork of the project
2. **Create a Branch**: `git checkout -b feature/YourFeature`
3. **Make Changes**: Implement your feature or bug fix
4. **Write Tests**: Ensure your code is well-tested
5. **Commit Changes**: `git commit -m 'Add some feature'`
6. **Push to Branch**: `git push origin feature/YourFeature`
7. **Open Pull Request**: Submit a PR with detailed description

### Contribution Guidelines
- Follow Rust coding standards
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and collaborative

---

## Troubleshooting

### Common Issues

**Issue**: Pass creation fails with "You already have a pending pass"
**Solution**: Wait for admin approval or expire your existing pass before creating a new one

**Issue**: Approval fails with "Cannot Approved!!"
**Solution**: Verify the pass exists and hasn't been approved already

**Issue**: Expiration fails with error message
**Solution**: Ensure the pass is approved and not already expired

**Issue**: Contract deployment fails
**Solution**: Check your Stellar account has sufficient XLM balance and verify network connectivity

---

## Performance Metrics

- **Pass Creation**: ~5 seconds average
- **Pass Approval**: ~3 seconds average
- **Pass Expiration**: ~3 seconds average
- **Data Retrieval**: <1 second
- **Storage Cost**: Minimal (instance storage with extended TTL)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built on [Stellar Soroban](https://soroban.stellar.org/) smart contract platform
- Inspired by the need for modern, transparent access control systems
- Thanks to the Stellar developer community for their support

---

## Contact & Support

For questions, issues, or support:
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: [Full docs](https://docs.your-project.com)
- **Community**: Join our [Discord/Telegram]

---

## Roadmap

- **Q1 2025**: Mobile app development
- **Q2 2025**: QR code integration
- **Q3 2025**: IoT device integration
- **Q4 2025**: Multi-organization network launch

## Contract Details
CDXZSHCWTWRMUPOSPUN3GZQIVBTES7ST67CFU3L6CWCTDTBY5KB54JOF
![alt text](<Screenshot 2025-10-29 at 3.38.56 PM.png>)
# Simple_Voting_System
