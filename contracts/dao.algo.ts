import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  registeredAsa = GlobalStateKey<Asset>();

  proposal = GlobalStateKey<string>();

  votesTotal = GlobalStateKey<number>();

  votesInFavor = GlobalStateKey<number>();

  alreadyVote = LocalStateKey<uint64>();

  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  optInToApplication(): void {}

  getProposal(): string {
    return this.proposal.value;
  }

  // Mint DAO token
  bootstrap(): Asset {
    // Only allow app creator to call this method
    verifyTxn(this.txn, { sender: this.app.creator });

    // Verify the asset hasn't already been registered
    assert(!this.registeredAsa.exists);

    // Create the asset
    this.registeredAsa.value = sendAssetCreation({
      configAssetTotal: 1_000,
      configAssetFreeze: this.app.address,
    });

    return this.registeredAsa.value;
  }

  // Register method that gives the person the ASA and then freezes it
  // registeredAsaP is needed to tell ledger that the asset will be used in this method
  // without it, the ledger will not allow the asset to be used in this method
  register(registeredAsaP: Asset): void {
    assert(registeredAsaP.id === this.registeredAsa.value.id);
    assert(this.txn.sender.assetBalance(this.registeredAsa.value) === 0);

    sendAssetTransfer({
      xferAsset: this.registeredAsa.value,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
    });

    sendAssetFreeze({
      freezeAsset: this.registeredAsa.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: true,
    });
  }

  vote(inFavor: boolean): void {
    this.votesTotal.value += 1;

    if (inFavor) {
      this.votesInFavor.value += 1;
    }

    assert(!this.alreadyVote(this.txn.sender).exists);
    this.alreadyVote(this.txn.sender).value = 1;
  }

  getAppId(): number {
    return this.app.id;
  }

  getVotesTotal(): [number, number] {
    return [this.votesTotal.value, this.votesInFavor.value];
  }

  getRegisteredAsa(): Asset {
    return this.registeredAsa.value;
  }

  getAlreadyVote(): number {
    return this.alreadyVote(this.txn.sender).value;
  }
}
