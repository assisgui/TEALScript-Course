import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { DaoClient } from '../contracts/clients/Dao';

const fixture = algorandFixture();

let appClient: DaoClient;

describe('Dao', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'This is a proposal.';

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount } = fixture.context;

    appClient = new DaoClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({
      proposal,
    });
  });

  test('getProposal', async () => {
    const proposalFromMethod = await appClient.getProposal({});
    expect(proposalFromMethod.return?.valueOf()).toBe(proposal);
  });

  test('vote in favor & getVotesTotal', async () => {
    await appClient.vote({
      inFavor: true,
    });
    const votesAfter = await appClient.getVotesTotal({});
    expect(votesAfter.return?.valueOf()).toEqual([BigInt(1), BigInt(1)]);
  });

  test('vote against & getVotesTotal', async () => {
    await appClient.vote({
      inFavor: false,
    });
    const votesAfter = await appClient.getVotesTotal({});
    expect(votesAfter.return?.valueOf()).toEqual([BigInt(2), BigInt(1)]);
  });
});
