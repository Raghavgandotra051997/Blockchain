import { UsageRecord } from './usageRecord';
/*
 * SPDX-License-Identifier: Apache-2.0
 */

// import { X509Certificate } from 'crypto';
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

import stringify from 'json-stringify-deterministic'; // Deterministic JSON.stringify()
import sortKeysRecursive from 'sort-keys-recursive';
// import { TextDecoder } from 'util';
// import { Asset } from './asset';
import { Patient } from './patient';
import { Case } from './case';

// const utf8Decoder = new TextDecoder();

@Info({title: 'EMR Smart Contract', description: 'Smart contract for EMR Data'})
export class EMRSmartContract extends Contract {
    public async GetPatient(ctx: Context, patientId: string): Promise<Patient> {
        const patientBytes = await ctx.stub.getState(patientId);
        if (!patientBytes || patientBytes.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }
        return unmarshal(patientBytes) as Patient;
    }

    private async  CheckAuthorization(ctx: Context, doctorId: string, patientID: string): Promise<boolean> {
        const patientInfo = await this.GetPatient(ctx, patientID);
        const authorizedDoctors = patientInfo.AuthorizedDoctors;
        return authorizedDoctors.includes(doctorId);
    }
    @Transaction()
    public async InitLedger(ctx: Context, numberOfRecords: number): Promise<string[]> {
        const p_ids: string[] = [];
        for (let i = 100; i < 100+numberOfRecords; i++) {
            const patientId = `PATIENT_${i}`;
            const authorizedDoctors = [`DOCTOR_${i}`]; // Simple example, adjust as needed.
            const medicalRecords: Case[] = [Case.newInstance({
                ID: `${i}`,
                TestResults: `Results_${i}`,
                Diagnosis: `Diagnosis_${i}`,
                Treatments: `Treatment_${i}`,
            // Populate other fields as necessary...
            })];

            // Create a Patient object
            const patient = Patient.newInstance({
                ID: `PATIENT_${i}`,
                AuthorizedDoctors: authorizedDoctors,
                Cases: medicalRecords,
                Username: `User_${i}`,
            // Populate other fields as necessary...
            });
            console.log(marshal(patient));
            // Convert to buffer and put state into the ledger
            await ctx.stub.putState(patientId, marshal(patient));
            p_ids.push(patientId);
        }
        return p_ids;
    }

    @Transaction(false)
    @Returns('Patient[]')
    public async GetAllPatients(ctx: Context): Promise<string> {
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const queryString = '{"selector": {}}'; // Query for all documents
        const iterator = await ctx.stub.getQueryResult(queryString);
        const patients: Patient[] = [];
        console.log('here3');
        for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
            console.log('here');
            const patientBytes = result.value.value;
            try {
                const patient = Patient.newInstance(unmarshal(patientBytes));
                patients.push(patient);
                console.log(patient);
            } catch (err) {
                console.log(err);
            }
        }

        return marshal(patients).toString();
    }


    public async  RecordOperation(ctx: Context, operation: string, userId: string, timestamp: string): Promise<void> {
        const operationLogId = `log-${timestamp}-${operation}-${userId}`;
        const record =  UsageRecord.newInstance({
            Operation: operation,
            ID: operationLogId,
            UserID: userId,
            Timestamp: new Date().toISOString()
        });
        await ctx.stub.putState(operationLogId, marshal(record));
    }

    @Transaction(false)
    @Returns('string')
    async QueryInformation(ctx: Context, userType: string, userId: string, patientId?: string): Promise<string> {
        if (userType === 'patient') {
            const patientInfo = await this.GetPatient(ctx, userId);
            await this.RecordOperation(ctx, 'read', userId, new Date().toISOString());
            return JSON.stringify(patientInfo);
        } else if (userType === 'doctor') {
            if (!patientId) {
                throw new Error('Patient ID must be provided');
            }
            const patientInfo = await this.GetPatient(ctx, patientId);
            const isAuthorized = await this.CheckAuthorization(ctx, userId, patientInfo.ID);
            if (!isAuthorized) {
                throw new Error('Unauthorized access');
            }
            await this.RecordOperation(ctx, 'read', userId, new Date().toISOString());
            return JSON.stringify(patientInfo);
        } else {
            throw new Error('Invalid user type');
        }
    }

    @Transaction()
    async AuthorizeDoctor(ctx: Context, patientId: string, doctorId: string): Promise<void> {
        const patientInfo = await this.GetPatient(ctx, patientId);
        if (await this.CheckAuthorization(ctx, doctorId, patientInfo.ID)) {
            throw new Error('Doctor is already authorized');
        }
        patientInfo.AuthorizedDoctors.push(doctorId);
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientInfo)));
        await this.RecordOperation(ctx, 'AuthorizeDoctor', doctorId, new Date().toISOString());
    }

    @Transaction()
    async EnterData(ctx: Context, doctorId: string, patientId: string, TestResults: string, Diagnosis: string, Treatments: string, currentTime: string): Promise<void> {
        const patientInfo = await this.GetPatient(ctx, patientId);
        if (!await this.CheckAuthorization(ctx, doctorId, patientInfo.ID)) {
            throw new Error('Unauthorized access');
        }
        const medicalRecord: Case = Case.newInstance({TestResults, Diagnosis, Treatments});
        patientInfo.Cases.push(medicalRecord);
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientInfo)));
        await this.RecordOperation(ctx, 'EnterData', doctorId, currentTime);
    }
    @Transaction()
    async CreatePatient(ctx: Context, doctorId: string, patientId: string, TestResults: string, Diagnosis: string, Treatments: string, currentTime: string): Promise<void> {
        const patientInfo = await this.GetPatient(ctx, patientId);
        if (!await this.CheckAuthorization(ctx, doctorId, patientInfo.ID)) {
            throw new Error('Unauthorized access');
        }
        const medicalRecord: Case = Case.newInstance({TestResults, Diagnosis, Treatments});
        patientInfo.Cases.push(medicalRecord);
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientInfo)));
        await this.RecordOperation(ctx, 'EnterData', doctorId, currentTime);
    }
    @Transaction(false)
    @Returns('string')
    async QueryRecords(ctx: Context, id: string): Promise<Patient> {
        const existingPatientBytes = await this.#queryRecords(ctx, id);
        const existingPatient = Patient.newInstance(unmarshal(existingPatientBytes));

        return existingPatient;
    }

    async #queryRecords(ctx: Context, id: string): Promise<Uint8Array> {
        const PatientBytes = await ctx.stub.getState(id); // get the Patient from chaincode state
        if (!PatientBytes || PatientBytes.length === 0) {
            throw new Error(`Sorry, asset ${id} has not been created`);
        }

        return PatientBytes;
    }
}


function unmarshal(bytes: Uint8Array | string): object {
    const json: string = typeof bytes === 'string' ? bytes : bytes.toString();
    const parsed: unknown = JSON.parse(json);
    if (parsed === null || typeof parsed !== 'object') {
        throw new Error(`Invalid JSON type (${typeof parsed}): ${json}`);
    }

    return parsed;
}

function marshal(o: object): Buffer {
    return Buffer.from(toJSON(o));
}

function toJSON(o: object): string {
    // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return stringify(sortKeysRecursive(o));
}

// interface OwnerIdentifier {
//     org: string;
//     user: string;
// }

// function hasWritePermission(ctx: Context, asset: Asset): boolean {
//     const clientId = clientIdentifier(ctx);
//     const ownerId = unmarshal(asset.Owner) as OwnerIdentifier;
//     return clientId.org === ownerId.org;
// }

// function clientIdentifier(ctx: Context, user?: string): OwnerIdentifier {
//     return {
//         org: ctx.clientIdentity.getMSPID(),
//         user: user ?? clientCommonName(ctx),
//     };
// }

// function clientCommonName(ctx: Context): string {
//     const clientCert = new X509Certificate(ctx.clientIdentity.getIDBytes());
//     const matches = clientCert.subject.match(/^CN=(.*)$/m); // [0] Matching string; [1] capture group
//     if (matches?.length !== 2) {
//         throw new Error(`Unable to identify client identity common name: ${clientCert.subject}`);
//     }

//     return matches[1];
// }

// function ownerIdentifier(user: string, org: string): OwnerIdentifier {
//     return { org, user };
// }

// async function setEndorsingOrgs(ctx: Context, ledgerKey: string, ...orgs: string[]): Promise<void> {
//     const policy = newMemberPolicy(...orgs);
//     await ctx.stub.setStateValidationParameter(ledgerKey, policy.getPolicy());
// }

// function newMemberPolicy(...orgs: string[]): KeyEndorsementPolicy {
//     const policy = new KeyEndorsementPolicy();
//     policy.addOrgs('MEMBER', ...orgs);
//     return policy;
// }
