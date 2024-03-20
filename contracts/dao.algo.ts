import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Dao extends Contract {
  proposal = GlobalStateKey<string>();

  votesTotal = GlobalStateKey<number>();

  votesInFavor = GlobalStateKey<number>();

  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  getProposal(): string {
    return this.proposal.value;
  }

  // Change this method to allow the user to say if they are in favor or not
  vote(inFavor: boolean): void {
    this.votesTotal.value += 1; // This is not supported by TEAL

    if (inFavor) {
      this.votesInFavor.value += 1; // This is not supported by TEAL
    }
  }

  // Change this method to return total votes AND total votes in favor
  getVotesTotal(): [number, number] {
    return [this.votesTotal.value, this.votesInFavor.value];
  }
}
