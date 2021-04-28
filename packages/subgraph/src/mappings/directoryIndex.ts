import {
  SegmentAdded,
  SegmentRemoved,
} from '../../generated/Directory/DirectoryIndexContract';
import { ArbitrableDirectoryTemplate } from '../../generated/templates';
import { ArbitrableDirectoryContract } from '../../generated/templates/ArbitrableDirectoryTemplate/ArbitrableDirectoryContract';
import { Directory } from '../../generated/schema';
import { Address, log } from '@graphprotocol/graph-ts';

function safeGetDirectory(directoryAddress: Address): Directory {
  let directory = Directory.load(directoryAddress.toHexString());
  if (!directory) {
    directory = new Directory(directoryAddress.toHexString());
  }
  return directory; 
}

// Handle the addition of a new segment
export function handleDirectoryAdded(event: SegmentAdded): void {

  // Get the contract using its address
  const directoryContract = ArbitrableDirectoryContract.bind(event.params.segment);
  if (directoryContract) {
    // Create the directory entity
    const directory = safeGetDirectory(event.params.segment);
    directory.isRemoved = false;
    directory.addedAtTimestamp = event.block.timestamp;
    directory.addedAtBlockNumber = event.block.number;
    directory.segment = directoryContract.getSegment();
    directory.save();

    // Start indexing this directory contract using the data source template
    ArbitrableDirectoryTemplate.create(event.params.segment);
  } else {
    log.error('handleDirectoryAdded|Directory Not found|{}', [event.params.segment.toHexString()]);
  }

}

// Handle the removal of a segment
export function handleDirectoryRemoved(event: SegmentRemoved): void {
  const directory = safeGetDirectory(event.params.segment);
  directory.isRemoved = true;
  directory.removedAtTimestamp = event.block.timestamp;
  directory.removedAtBlockNumber = event.block.number;
  directory.save();
}
