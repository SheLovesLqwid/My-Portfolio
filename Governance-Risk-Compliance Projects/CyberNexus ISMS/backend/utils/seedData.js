const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Risk = require('../models/Risk');
const SoA = require('../models/SoA');
const Audit = require('../models/Audit');
const Policy = require('../models/Policy');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Risk.deleteMany({});
    await SoA.deleteMany({});
    await Audit.deleteMany({});
    await Policy.deleteMany({});

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@cybernexus.com',
      password: 'Admin123!',
      role: 'Admin',
      department: 'IT Security'
    });

    const managerUser = await User.create({
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@cybernexus.com',
      password: 'Manager123!',
      role: 'Manager',
      department: 'Operations'
    });

    const auditorUser = await User.create({
      firstName: 'Sarah',
      lastName: 'Auditor',
      email: 'auditor@cybernexus.com',
      password: 'Auditor123!',
      role: 'Auditor',
      department: 'Compliance'
    });

    const regularUser = await User.create({
      firstName: 'Mike',
      lastName: 'Employee',
      email: 'user@cybernexus.com',
      password: 'User123!',
      role: 'User',
      department: 'Finance'
    });

    console.log('Users created successfully');

    const sampleRisks = [
      {
        riskId: 'RISK-0001',
        title: 'Unauthorized Access to Customer Database',
        description: 'Risk of unauthorized personnel gaining access to sensitive customer information stored in the main database.',
        category: 'Technical',
        likelihood: 3,
        impact: 5,
        owner: adminUser._id,
        treatment: 'Mitigate',
        treatmentPlan: 'Implement multi-factor authentication and regular access reviews',
        status: 'Open',
        reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      },
      {
        riskId: 'RISK-0002',
        title: 'Data Breach via Email Phishing',
        description: 'Employees may fall victim to phishing attacks leading to credential compromise and data breach.',
        category: 'Operational',
        likelihood: 4,
        impact: 4,
        owner: managerUser._id,
        treatment: 'Mitigate',
        treatmentPlan: 'Conduct regular security awareness training and implement email filtering',
        status: 'In Progress',
        reviewDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: auditorUser._id
      },
      {
        riskId: 'RISK-0003',
        title: 'Ransomware Attack on Critical Systems',
        description: 'Risk of ransomware infection affecting critical business systems and operations.',
        category: 'Technical',
        likelihood: 2,
        impact: 5,
        owner: adminUser._id,
        treatment: 'Mitigate',
        treatmentPlan: 'Implement endpoint protection, regular backups, and incident response procedures',
        status: 'Monitoring',
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      }
    ];

    await Risk.insertMany(sampleRisks);
    console.log('Sample risks created successfully');

    const sampleControls = [
      {
        controlId: 'A.9.1.1',
        controlTitle: 'Access control policy',
        controlDescription: 'An access control policy shall be established, documented and reviewed based on business and information security requirements.',
        category: 'A.9 Access Control',
        applicability: 'Applicable',
        implementationStatus: 'Implemented',
        justification: 'Access control policy is essential for protecting sensitive information and systems.',
        responsibleOwner: adminUser._id,
        implementationDetails: 'Comprehensive access control policy documented and approved by management.',
        evidenceLocation: 'Document Management System - Policy Repository',
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      },
      {
        controlId: 'A.12.1.1',
        controlTitle: 'Documented operating procedures',
        controlDescription: 'Operating procedures shall be documented and made available to all users who need them.',
        category: 'A.12 Operations Security',
        applicability: 'Applicable',
        implementationStatus: 'Partially Implemented',
        justification: 'Operating procedures are necessary for consistent and secure operations.',
        responsibleOwner: managerUser._id,
        implementationDetails: 'Some procedures documented, work in progress for complete coverage.',
        evidenceLocation: 'Operations Manual - Version 2.1',
        nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdBy: auditorUser._id
      },
      {
        controlId: 'A.16.1.1',
        controlTitle: 'Responsibilities and procedures',
        controlDescription: 'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents.',
        category: 'A.16 Information Security Incident Management',
        applicability: 'Applicable',
        implementationStatus: 'Implemented',
        justification: 'Incident response capabilities are critical for minimizing impact of security incidents.',
        responsibleOwner: adminUser._id,
        implementationDetails: 'Incident response team established with defined roles and procedures.',
        evidenceLocation: 'Incident Response Plan v3.0',
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      }
    ];

    await SoA.insertMany(sampleControls);
    console.log('Sample SoA controls created successfully');

    const sampleAudit = {
      auditId: 'AUD-0001',
      title: 'Annual ISO 27001 Internal Audit',
      type: 'Internal',
      scope: 'Information Security Management System - All departments',
      objectives: 'Verify compliance with ISO 27001 requirements and identify areas for improvement',
      auditCriteria: 'ISO/IEC 27001:2013 standard requirements',
      leadAuditor: auditorUser._id,
      auditTeam: [auditorUser._id],
      auditees: [adminUser._id, managerUser._id],
      plannedStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      plannedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'Planned',
      findings: [
        {
          findingId: 'AUD-0001-F01',
          title: 'Incomplete Access Review Documentation',
          description: 'Access review records for Q3 2024 are incomplete for the Finance department.',
          severity: 'Medium',
          category: 'Non-Conformity',
          relatedControl: 'A.9.2.5',
          correctiveAction: 'Complete missing access review documentation and establish quarterly review schedule.',
          actionOwner: managerUser._id,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'Open'
        }
      ],
      createdBy: auditorUser._id
    };

    await Audit.create(sampleAudit);
    console.log('Sample audit created successfully');

    console.log('Seed data created successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@cybernexus.com / Admin123!');
    console.log('Manager: manager@cybernexus.com / Manager123!');
    console.log('Auditor: auditor@cybernexus.com / Auditor123!');
    console.log('User: user@cybernexus.com / User123!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
