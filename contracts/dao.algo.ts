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

  vote(inFavor: boolean): void {
    this.votesTotal.value += 1;

    if (inFavor) {
      this.votesInFavor.value += 1;
    }

    // assert(!this.alreadyVote(this.txn.sender).exists);
    // this.alreadyVote(this.txn.sender).value = 1;
  }

  getVotesTotal(): [number, number] {
    return [this.votesTotal.value, this.votesInFavor.value];
  }

  getRegisteredAsa(): Asset {
    return this.registeredAsa.value;
  }

  get getAlreadyVote(): number {
    return this.alreadyVote(this.txn.sender).value;
  }
}
