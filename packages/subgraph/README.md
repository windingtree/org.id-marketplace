# ORGiD Subgraph

This subgraph tracks events occuring on Winding Tree's ORGiD contract.

The data can later be queried using a GraphQL API.

## Usage Example

Get 5 random ORGiDs, their owner and the country of the legal entity:

```shell
curl -X POST \
    -d '{ "query": "query { organizations(first: 5) { id owner legalEntity { legalName } service {id} }}" }' \
    https://api.thegraph.com/subgraphs/name/windingtree/orgid-subgraph
```

## Installation

The below instructions are adapted from [The Graph quickstart](https://thegraph.com/docs/quick-start#local-development).

Install dependencies:

```shell
npm run install
```

## Local Development

### Start a local Graph Node

In a dedicated terminal:

```shell
# Clone the Graph Node repository
cd /tmp
git clone https://github.com/graphprotocol/graph-node/

# Change directory to Docker
cd graph-node/docker
```

By default, the ethereum node will be assumed to be the docker host IP and the network mainnet, but you can update it in the `docker-compose.yml` file.

__For Linux__: the docket host IP must be updated using the `setup.sh` script:

```shell
# ! Linux Only ! run setup.sh to update the host IP in docker settings
./setup.sh
```

For an externally hosted node type infura, the ethereum node URL must be updated in the `docker-compose.yml` file.

Then launch the node:

```shell
# Start the graph node
docker-compose up
```

### Initialize the subgraph

Generate code:

```shell
npm run codegen:mainnet
```

Build the subgraph:

```shell
npm run build
```

Allocate the subgraph in the Graph Node with:

```shell
npm run create-local
```

Deploy the subgraph locally:

```shell
npm run deploy-local
```

This will trigger the indexing of the subgraph in the Graph node and can take some time. Check the Graph node logs to check when data ingestion is completed.

Once the ingestion is completed, you can query the Graph Node, for example to get all organizations:

```shell
curl -X POST \
    -d '{ "query": "{organizations {id, owner, isActive}}" }' \
    http://localhost:8000/subgraphs/name/windingtree/orgid-subgraph
```

## Deploy to The Graph

Create an access token and store it locally. `<ACCESS_TOKEN>` is from [The Graph Dashboard](https://thegraph.com/explorer/dashboard).

```shell
graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>
```

Then deploy, for example in Mainnet:

```shell
npm run deploy:mainnet
```

For Ropsten:

```shell
npm run deploy:ropsten
```

Status on the synchronization can be retrieved using:

```shell
curl -X POST \
    -d '{ "query": "query { indexingStatusForPendingVersion(subgraphName: \"windingtree/orgid-subgraph\") { synced health fatalError { message handler} }}" }' \
    https://api.thegraph.com/index-node/graphql
```
