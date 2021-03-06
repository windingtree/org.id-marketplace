import {
  Address,
	Bytes,
  log,
} from '@graphprotocol/graph-ts';

import {
  ORGID_ADDRESS
} from './constants';

import {
  OrgIdContract,
} from '../generated/OrgId/OrgIdContract';

import { Organization } from '../generated/schema';

// ORGiD Contract
export const orgidContract = OrgIdContract.bind(Address.fromString(ORGID_ADDRESS));

// Get organization from contract
export function getOrganizationFromContract(id: Bytes): Organization | null {

  // Lazy-load organization
  let organization = Organization.load(id.toHex());
  if (organization == null) {
    organization = new Organization(id.toHex());
    organization.did = 'did:orgid:'.concat(id.toHexString());
  }

  // Retrieve additional details from smartcontract
  const getOrganizationCallResult = orgidContract.try_getOrganization(id);

  // Check if the call reverted
  if (getOrganizationCallResult.reverted) {
    log.warning('getOrganization reverted: {}', [id.toHex()]);
    return null;
  }

  // Retrieve values from contract
  const exists                 = getOrganizationCallResult.value.value0;
  const orgJsonHash            = getOrganizationCallResult.value.value2;
  const parentOrgId            = getOrganizationCallResult.value.value6;
  const owner                  = getOrganizationCallResult.value.value7;
  const director               = getOrganizationCallResult.value.value8;
  const isActive               = getOrganizationCallResult.value.value9;
  const isDirectorshipAccepted = getOrganizationCallResult.value.value10;

  // Check if the organization exists
  if (!exists) {
    log.warning('Organization does not exist', []);
    return null;
  }

  // Map values which have a 1:1 relationship
  organization.orgJsonHash = orgJsonHash;
  organization.isActive = isActive;
  organization.owner = owner;

  // Map Director
  if (isDirectorshipAccepted && director != null) {
    organization.director = director;
  }

  // Map Parent
  if (parentOrgId != null) {
    organization.parent = parentOrgId.toHexString();
  }

  return organization;
}
