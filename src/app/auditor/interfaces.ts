export interface ITrackCircuit {
    mnemonic: string;
    name: string;
    direction?: string;
    type?: string;
    nodeName?: string;
    nodeMnemonic?: string;
    arcName?: string;
    arcMnemonic?: string;
    trainDetectorMnemonic: string;
    circulationTrackMnemonic?: string;
    stationingTrackMnemonic?: string;
    pk?: number;
    auditedTczName?: string;
    auditedTczMnemonic?: string;
    auditedNodeName?: string;
    auditedNodeMnemonic?: string;
}