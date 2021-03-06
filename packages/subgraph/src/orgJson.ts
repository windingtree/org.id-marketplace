import {
  JSONValue,
  JSONValueKind,
  log,
  TypedMap,
  BigDecimal,
} from '@graphprotocol/graph-ts';

import { getJson } from './ipfs';
import {
  LegalEntity,
  OrganizationalUnit,
  OrganizationAddress,
  PublicKey,
  Service,
  Point
} from '../generated/schema';

// Structure to provide the parsed data
export class OrgJson {
  did: string
  organizationalType: string
  legalEntity: LegalEntity
  organizationalUnit: OrganizationalUnit
  //publicKey: PublicKey[]
  //service: Service[]
}

// Get safely a property of an object
function safeGet(jsonObject: TypedMap<string, JSONValue> | null, expectedKind: JSONValueKind, property: string): JSONValue | null {
  if (jsonObject == null) {
    return null;
  }

  // Check presence
  if (!jsonObject.isSet(property)) {
    log.info('OrgJSON|{}|Missing property', [property]);
    return null;
  }

  // Get the property value
  const value = jsonObject.get(property);
  if (value.kind != expectedKind) {
    log.error('OrgJSON|{}|Unexpected kind', [property]);
    return null;
  }

  return value;
}

// Get a propeperty as string
function getStringProperty(jsonObject: TypedMap<string, JSONValue> | null, property: string): string | null {
  const value = safeGet(jsonObject, JSONValueKind.STRING, property);
  return value != null ? value.toString() : null;
}

// Get a propeperty as object
function getObjectProperty(jsonObject: TypedMap<string, JSONValue> | null, property: string): TypedMap<string, JSONValue> | null {
  const value = safeGet(jsonObject, JSONValueKind.OBJECT, property);
  return value != null ? value.toObject() : null;
}

// Get a propperty as array
function getArrayProperty(jsonObject: TypedMap<string, JSONValue> | null, property: string): Array<JSONValue> | null {
  const value = safeGet(jsonObject, JSONValueKind.ARRAY, property);
  return value != null ? value.toArray() : null;
}

// Convert a JSON Value to an Address
function toAddress(orgId: string, jsonObject: TypedMap<string, JSONValue> | null): OrganizationAddress | null {
  if (jsonObject == null) {
    return null;
  }

  let outputAddress = OrganizationAddress.load(orgId);
  if (!outputAddress) {
    outputAddress = new OrganizationAddress(orgId);
  }

  // Handle elements of the address
  outputAddress.country = getStringProperty(jsonObject, 'country');
  outputAddress.subdivision = getStringProperty(jsonObject, 'subdivision');
  outputAddress.locality = getStringProperty(jsonObject, 'locality');
  outputAddress.streetAddress = getStringProperty(jsonObject, 'streetAddress');
  outputAddress.postalCode = getStringProperty(jsonObject, 'postalCode');

  // Handle coordinates
  const gpsCoordinates = getStringProperty(jsonObject, 'gps');
  if (gpsCoordinates) {
    const parts = gpsCoordinates.split(',');
    if (!parts || parts.length != 2) {
      log.error('OrgJSON|{}|Invalid GPS Coordinates format', [orgId]);
    } else {
      const latitude = BigDecimal.fromString(parts[0]);
      const longitude = BigDecimal.fromString(parts[1]);
      if (latitude && longitude) {
        const point = new Point(orgId);
        point.latitude = latitude;
        point.longitude = longitude;
        point.save();
        outputAddress.gps = point.id;
      }
    }
  }

  return outputAddress;

}

// Convert a JSON Value to a Public Key
function toPublicKey(orgId: string, jsonObject: TypedMap<string, JSONValue> | null): PublicKey | null {
  // Abort if object is null
  if (jsonObject == null) {
    return null;
  }

  // Retrieve mandatory elements
  const did = getStringProperty(jsonObject, 'id');
  const pem = getStringProperty(jsonObject, 'publicKeyPem');
  const type = getStringProperty(jsonObject, 'type');

  // Abort if mandatory elements are missing
  if ((did == null) || (pem == null) || (type == null)) {
    log.error('OrgJSON|{}|Missing mandatory Public Key properties', [orgId]);
    return null;
  }

  // Determine the entity ID and safe load
  const outputPublicKeyId = orgId.concat('-').concat(did);
  let outputPublicKey = PublicKey.load(outputPublicKeyId);
  if (!outputPublicKey) {
    outputPublicKey = new PublicKey(outputPublicKeyId);
  }

  // Update attributes
  outputPublicKey.did = did;
  outputPublicKey.organization = orgId;
  outputPublicKey.type = type;
  outputPublicKey.publicKeyPem = pem;
  outputPublicKey.controller = getStringProperty(jsonObject, 'controller');
  outputPublicKey.note = getStringProperty(jsonObject, 'note');

  // Enforce type is part of the GraphQL enum
  if (type == 'ETH' || type == 'secp256k1' || type == 'X25519') {
    outputPublicKey.type = type;
  } else {
    outputPublicKey.type = 'Unknown';
  }

  return outputPublicKey;

}

// Convert a JSON Object to a Service
function toService(orgId: string, jsonObject: TypedMap<string, JSONValue> | null): Service | null {
  // Abort if object is null
  if (jsonObject == null) {
    return null;
  }

  // Retrieve mandatory elements
  const did = getStringProperty(jsonObject, 'id');
  const serviceEndpoint = getStringProperty(jsonObject, 'serviceEndpoint');

  // Abort if mandatory elements are missing
  if ((did == null) || (serviceEndpoint == null)) {
    log.error('OrgJSON|{}|Missing mandatory Service properties', [orgId]);
    return null;
  }

  // Determine the entity ID and safe load
  const outputServiceId = orgId.concat('-').concat(did);
  let outputService = Service.load(outputServiceId);
  if (!outputService) {
    outputService = new Service(outputServiceId);
  }

  // Update attributes
  outputService.did = did;
  outputService.organization = orgId;
  outputService.serviceEndpoint = serviceEndpoint;
  outputService.type = getStringProperty(jsonObject, 'type');
  outputService.version = getStringProperty(jsonObject, 'version');
  outputService.description = getStringProperty(jsonObject, 'description');
  outputService.docs = getStringProperty(jsonObject, 'docs');

  return outputService;

}


// Convert a JSON Value to legal entity
function toLegalEntity(orgId: string, jsonObject: TypedMap<string, JSONValue> | null): LegalEntity | null {
  // Abort if object is null
  if (jsonObject == null) {
    return null;
  }

  // Determine the ID and safe load
  const outputLegalEntityId = 'did:orgid:'.concat(orgId);
  let outputLegalEntity = LegalEntity.load(outputLegalEntityId);
  if (!outputLegalEntity) {
    outputLegalEntity = new LegalEntity(outputLegalEntityId);
  }

  // Handle legal name presence
  outputLegalEntity.legalName = getStringProperty(jsonObject, 'legalName');
  outputLegalEntity.legalType = getStringProperty(jsonObject, 'legalType');
  outputLegalEntity.legalIdentifier = getStringProperty(jsonObject, 'legalIdentifier');

  // Handle the address
  const addressObject = getObjectProperty(jsonObject, 'registeredAddress');
  if (addressObject) {
    const address = toAddress(orgId, addressObject);
    if (address) {
      address.save();
      outputLegalEntity.registeredAddress = address.id;
    }
  }

  return outputLegalEntity;
}

// Convert a JSON Value to an organizational unit
function toOrganizationalUnit(orgId: string, jsonObject: TypedMap<string, JSONValue> | null): OrganizationalUnit | null {
  // Abort if object is null
  if (jsonObject == null) {
    return null;
  }

  // Determine the ID and safe load
  const outputOrganizationalUnitId = 'did:orgid:'.concat(orgId);
  let outputOrganizationalUnit = OrganizationalUnit.load(outputOrganizationalUnitId);
  if (!outputOrganizationalUnit) {
    outputOrganizationalUnit = new OrganizationalUnit(outputOrganizationalUnitId);
  }

  // Handle legal name presence
  outputOrganizationalUnit.name = getStringProperty(jsonObject, 'name');
  const types = getArrayProperty(jsonObject, 'type');
  if (types != null) {
    outputOrganizationalUnit.type = (types ).map<string>((value: JSONValue) => value.toString());
  }
  outputOrganizationalUnit.description = getStringProperty(jsonObject, 'description');
  outputOrganizationalUnit.longDescription = getStringProperty(jsonObject, 'longDescription');

  // Handle the address
  const addressObject = getObjectProperty(jsonObject, 'address');
  if (addressObject) {
    const address = toAddress(orgId, addressObject);
    if (address) {
      address.save();
      outputOrganizationalUnit.address = address.id;
    }
  }

  return outputOrganizationalUnit;
}

// Resolve an Organization
export function resolve(orgId: string, ipfsCid: string): OrgJson | null {

  // Extract JSON document
  const orgJsonValue = getJson(ipfsCid, JSONValueKind.OBJECT);
  if (!orgJsonValue) {
    log.warning('OrgJson|{}|Error fetching JSON', [ipfsCid]);
    return null;
  }
  const orgJsonObject = orgJsonValue.toObject();
  const orgJson = new OrgJson();

  // Process DID
  orgJson.did = getStringProperty(orgJsonObject, 'id');
  if (!orgJson.did) {
    log.error('orgJson|{}|Missing did', []);
    return null;
  }

  // Process Legal Entity
  const legalEntityObject = getObjectProperty(orgJsonObject, 'legalEntity');
  if (legalEntityObject) {
    orgJson.organizationalType = 'LegalEntity';
    const legalEntity = toLegalEntity(orgId, legalEntityObject);
    if (legalEntity != null) {
      orgJson.legalEntity = legalEntity ;
      orgJson.legalEntity.organization = orgId;
      orgJson.legalEntity.save();
    }
  }

  // Process Organizational Unit
  const organizationalUnitObject = getObjectProperty(orgJsonObject, 'organizationalUnit');
  if (organizationalUnitObject) {
    orgJson.organizationalType = 'OrganizationalUnit';
    const organizationalUnit = toOrganizationalUnit(orgId, organizationalUnitObject);
    if (organizationalUnit) {
      orgJson.organizationalUnit = organizationalUnit ;
      orgJson.organizationalUnit.organization = orgId;
      orgJson.organizationalUnit.save();
    }
  }

  // Process Public Keys
  const publicKeyArray = getArrayProperty(orgJsonObject, 'publicKey');
  if (publicKeyArray) {
    for(let i=0; i<publicKeyArray.length; i++) {
      const publicKeyValue = (publicKeyArray )[i];
      if (publicKeyValue.kind == JSONValueKind.OBJECT) {
        const publicKey = toPublicKey(orgId, publicKeyValue.toObject());
        if (publicKey != null) {
          publicKey.save();
        }
      }
    }
  }

  // Process Service list
  const serviceArray = getArrayProperty(orgJsonObject, 'service');
  if (serviceArray) {
    for(let i=0; i<serviceArray.length; i++) {
      const serviceValue = (serviceArray )[i];
      if (serviceValue.kind == JSONValueKind.OBJECT) {
        const service = toService(orgId, serviceValue.toObject());
        if (service != null) {
          service.save();
        }
      }
    }
  }

  return orgJson;
}
