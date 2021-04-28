import {
  DirectorshipAccepted,
  DirectorshipTransferred,
  OrgJsonChanged,
  OrganizationActiveStateChanged,
  OrganizationCreated,
  OrganizationOwnershipTransferred,
  UnitCreated,
} from '../../generated/OrgId/OrgIdContract';
// import { Bytes, log } from '@graphprotocol/graph-ts';
import { getOrganizationFromContract } from '../orgId';
import { cidFromHash } from '../ipfs';
import { resolve } from '../orgJson';
// import { PublicKey, Service } from '../../generated/schema';

// Handle the creation of a new organization
export function handleOrganizationCreated(event: OrganizationCreated): void {
  // Create organization with event data
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {
    // Update creation time
    organization.createdAtTimestamp = event.block.timestamp;
    organization.createdAtBlockNumber = event.block.number;
    organization.organizationType = 'LegalEntity';

    // Add JSON IPFS CID
    if (organization.orgJsonHash) {
      organization.ipfsCid = cidFromHash(organization.orgJsonHash );
      const orgJson = resolve(organization.id, organization.ipfsCid);

      if (orgJson) {
        // Add LegalEntity
        if (orgJson.legalEntity) {
          organization.legalEntity = orgJson.legalEntity.id;
        }

      }
    }

    // Save organization
    organization.save();
  }
}

// Handle the creation of a new unit
export function handleUnitCreated(event: UnitCreated): void {
  const unit = getOrganizationFromContract(event.params.unitOrgId);
  if (unit) {
    // Update creation time
    unit.createdAtTimestamp = event.block.timestamp;
    unit.createdAtBlockNumber = event.block.number;
    unit.organizationType = 'OrganizationalUnit';

    // Add JSON IPFS CID
    if (unit.orgJsonHash) {
      unit.ipfsCid = cidFromHash(unit.orgJsonHash );
      const orgJson = resolve(unit.id, unit.ipfsCid);

      if (orgJson) {
        // Add LegalEntity
        if (orgJson.organizationalUnit) {
          unit.organizationalUnit = orgJson.organizationalUnit.id;
        }

      }
    }

    // Save organization
    unit.save();
  }
}

export function handleOrgJsonChanged(event: OrgJsonChanged): void {
  // Retrieve the organization
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {

    // Update Hash and CID
    organization.orgJsonHash = event.params.newOrgJsonHash;
    organization.ipfsCid = cidFromHash(event.params.newOrgJsonHash);
    const orgJson = resolve(organization.id, organization.ipfsCid);

    if (orgJson) {
      // Add LegalEntity
      if (orgJson.legalEntity) {
        organization.legalEntity = orgJson.legalEntity.id;
      }

      // Add Organizational Unit
      if (orgJson.organizationalUnit) {
        organization.organizationalUnit = orgJson.organizationalUnit.id;
      }

      // Add other attributes
      organization.organizationType = orgJson.organizationalType;
    }

    organization.save();
  }
}

// Handle the change of status of an organization
export function handleOrganizationActiveStateChanged(event: OrganizationActiveStateChanged): void {
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {
    organization.isActive = event.params.newState;
    organization.save();
  }
}

// Handle the change of ownership
export function handleOrganizationOwnershipTransferred(event: OrganizationOwnershipTransferred): void {
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {
    organization.owner = event.params.newOwner;
    organization.save();
  }
}

// Handle the acceptance of directorship
export function handleDirectorshipAccepted(event: DirectorshipAccepted): void {
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {
    organization.director = event.params.director;
    organization.save();
  }
}

// Handle the transfer of directorship
export function handleDirectorshipTransferred(event: DirectorshipTransferred): void {
  const organization = getOrganizationFromContract(event.params.orgId);
  if (organization) {
    organization.director = event.params.newDirector;
    organization.save();
  }
}
