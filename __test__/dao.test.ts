import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { algos, getOrCreateKmdWalletAccount, microAlgos } from '@algorandfoundation/algokit-utils';
import { Account } from 'algosdk';
import { DaoClient } from '../contracts/clients/Dao';

const fixture = algorandFixture();

let appClient: DaoClient;

describe('Dao', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'This is a proposal.';
  let registeredAsa: bigint;
  let sender: Account;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;
    sender = await getOrCreateKmdWalletAccount(
      {
        name: 'tealscript-dao-sender',
        fundWith: algos(10),
      },
      algod,
      kmd
    );

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

    await appClient.appClient.fundAppAccount(microAlgos(200_000));
  });

  test('getProposal', async () => {
    const proposalFromMethod = await appClient.getProposal({});
    expect(proposalFromMethod.return?.valueOf()).toBe(proposal);
  });

  test('bootstrap', async () => {
    // default fee per tx is 0.001 ALGO or 1_000 uAlgos
    // bootstrap sends 1 innertxn, so 2 txns in total
    // thus, fee needs to be 2_000 uAlgos
    const bootstrapResult = await appClient.bootstrap(
      {},
      {
        sendParams: {
          fee: microAlgos(2_000),
        },
      }
    );

    registeredAsa = bootstrapResult.return!.valueOf();
    expect(registeredAsa).toBeGreaterThan(0);
  });

  test('getRegisteredASA', async () => {
    const registeredASAFromMethod = await appClient.getRegisteredAsa({});
    expect(registeredASAFromMethod.return?.valueOf()).toBe(registeredAsa);
  });

  test('bootstrap (Negative)', async () => {
    await expect(
      appClient.bootstrap(
        {},
        {
          sender,
          sendParams: {
            fee: microAlgos(2_000),
          },
        }
      )
    ).rejects.toThrow();
  });

  test('vote in favor & getVotesTotal & getAlreadyVote', async () => {
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
