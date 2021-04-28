import {
  log,
  // store,
  Address,
  BigInt
} from '@graphprotocol/graph-ts';
import {
  ChallengeContributed,
  Dispute,
  Evidence,
  MetaEvidence,
  OrganizationAdded,
  OrganizationChallenged,
  OrganizationRemoved,
  OrganizationRequestRemoved,
  OrganizationSubmitted,
  Ruling,
  SegmentChanged,
  // ArbitrableDirectoryContract,
} from '../../generated/templates/ArbitrableDirectoryTemplate/ArbitrableDirectoryContract';
import {
  Organization,
  Directory,
  Point,
  DirectoryOrganization,
} from '../../generated/schema';

// Handle a change of name of the directory
export function handleDirectoryNameChanged(event: SegmentChanged): void {
  const directory = Directory.load(event.address.toHexString()); // eslint-disable-line

  if (directory) {
    directory.segment = event.params._newSegment; // eslint-disable-line
    directory.save();
  } else {
    log.error('handleDirectoryNameChanged|Directory Not found|{}', [event.address.toHexString()]); // eslint-disable-line
  }
}

// Get the DirectoryOrganization mapping entity
function safeGetDirectoryOrganization(directoryAddress: Address, orgId: string): DirectoryOrganization | null {
  // Retrieve objects
  const directory = Directory.load(directoryAddress.toHexString());
  const organization = Organization.load(orgId);

  // Abort if objects can not be retrieved
  if ((directory == null) || (organization == null)) {
    log.error('arbitrableDirectory|Organization or Directory do not exist|{}|{}', [directoryAddress.toHexString(), orgId]);
    return null;
  }

  // Create mapping id and retrieve
  const directoryOrganizationId = directory.id.concat('-').concat(organization.id);
  let directoryOrganization = DirectoryOrganization.load(directoryOrganizationId);

  // If mapping does not exist, create it
  if (!directoryOrganization) {
    directoryOrganization = new DirectoryOrganization(directoryOrganizationId);

    // Add properties
    directoryOrganization.directory = directory.id;
    directoryOrganization.organization = organization.id;
    directoryOrganization.segment = directory.segment;

    // Add GPS coordinates
    const locationPoint = Point.load(orgId);
    if (locationPoint) {
      directoryOrganization.latitude = locationPoint.latitude;
      directoryOrganization.longitude = locationPoint.longitude;
    }

    // Add default state - to be updated by specialized function
    directoryOrganization.registrationStatus = 'Unknown';
    directoryOrganization.isIncluded = false;
  }

  return directoryOrganization;

}

// Update the registration status of an Organization in a Directory
function updateDirectoryOrganizationStatus( // eslint-disable-line
    directoryAddress: Address,
    orgId: string,
    status: string,
    isIncluded: boolean,
    eventTimestamp: BigInt,
    eventBlockNumber: BigInt,
  ): void {
  // Retrieve mapping
  const directoryOrganization = safeGetDirectoryOrganization(directoryAddress, orgId);

  // Update status
  if (directoryOrganization != null) {
    // Update the status
    directoryOrganization.registrationStatus = status;
    directoryOrganization.isIncluded = isIncluded;

    // Update timestamps
    if (status == 'Registered') {
      directoryOrganization.registeredAtTimestamp = eventTimestamp;
      directoryOrganization.registeredAtBlockNumber = eventBlockNumber;
    }

    if (status == 'Removed') {
      directoryOrganization.removedAtTimestamp = eventTimestamp;
      directoryOrganization.removedAtBlockNumber = eventBlockNumber;
    }

    directoryOrganization.save();
  }
}

// Handle the request of an organization to join the directory
export function handleOrganizationSubmitted(event: OrganizationSubmitted): void {
  // eslint-disable-next
  updateDirectoryOrganizationStatus(
    event.address,
    event.params._organization.toHexString(),
    'RegistrationRequested',
    false,
    event.block.timestamp,
    event.block.number,
  );
}

// Handle the withdrawl of the request of an organization to join the directory
export function handleOrganizationRequestRemoved(event: OrganizationRequestRemoved): void {
  updateDirectoryOrganizationStatus(
    event.address,
    event.params._organization.toHexString(),
    'WithdrawalRequested',
    false,
    event.block.timestamp,
    event.block.number,
  );
}

// Handle the inclusion of a new organization in the directory
export function handleOrganizationAdded(event: OrganizationAdded): void {
  updateDirectoryOrganizationStatus(
    event.address,
    event.params._organization.toHexString(),
    'Registered',
    true,
    event.block.timestamp,
    event.block.number,
  );
}

// Handle the removal of an organization from the directory
export function handleOrganizationRemoved(event: OrganizationRemoved): void {
  updateDirectoryOrganizationStatus(
    event.address,
    event.params._organization.toHexString(),
    'Removed',
    false,
    event.block.timestamp,
    event.block.number,
  );
}

// Handle the challenge of an organization
export function handleOrganizationChallenged(event: OrganizationChallenged): void {
  updateDirectoryOrganizationStatus(
    event.address,
    event.params._organization.toHexString(),
    'Challenged',
    true,
    event.block.timestamp,
    event.block.number,
  );
}

/* TODO: Handle challenges and arbitration process */
export function handleRuling(event: Ruling): void {} // eslint-disable-line

export function handleChallengeContributed(event: ChallengeContributed): void {} // eslint-disable-line

export function handleDispute(event: Dispute): void {} // eslint-disable-line

export function handleEvidence(event: Evidence): void {} // eslint-disable-line

export function handleMetaEvidence(event: MetaEvidence): void {} // eslint-disable-line
