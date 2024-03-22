import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import {
  algos,
  getOrCreateKmdWalletAccount,
  getTransactionParams,
  microAlgos,
  sendTransaction,
} from '@algorandfoundation/algokit-utils';
import {
  Account,
  Algodv2,
  makeApplicationOptInTxnFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
} from 'algosdk';
import { DaoClient } from '../contracts/clients/Dao';

const fixture = algorandFixture();

let appClient: DaoClient;

describe('Dao', () => {
  beforeEach(fixture.beforeEach);
  const proposal = 'This is a proposal.';
  let registeredAsa: bigint;
  let sender: Account;
  let sender2: Account;
  let algod: Algodv2;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount, kmd } = fixture.context;
    algod = fixture.context.algod;

    sender = await getOrCreateKmdWalletAccount(
      {
        name: 'tealscript-dao-sender',
        fundWith: algos(10),
      },
      algod,
      kmd
    );
    console.log('sender', sender.addr);
    sender2 = await getOrCreateKmdWalletAccount(
      {
        name: 'tealscript-dao-sender2',
        fundWith: algos(10),
      },
      algod,
      kmd
    );
    console.log('sender2', sender2.addr);

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

  test('register', async () => {
    try {
      const registeredAsaOptInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: sender.addr,
        to: sender.addr,
        amount: 0,
        suggestedParams: await getTransactionParams(undefined, algod),
        assetIndex: Number(registeredAsa),
      });

      await sendTransaction(
        {
          from: sender,
          transaction: registeredAsaOptInTxn,
        },
        algod
      );

      await appClient.register(
        { registeredAsaP: registeredAsa },
        {
          sender,
          sendParams: {
            fee: microAlgos(3_000),
          },
        }
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
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
    // Opt-in to the application
    const optMth = appClient.optIn;
    await optMth.optInToApplication({}, { sender });

    // Vote in favor and adding local state
    await appClient.vote(
      {
        inFavor: true,
      },
      {
        sender,
      }
    );
    const votesAfter = await appClient.getVotesTotal({});
    expect(votesAfter.return?.valueOf()).toEqual([BigInt(1), BigInt(1)]);

    const alreadyVote = await appClient.getAlreadyVote(
      {},
      {
        sender,
      }
    );
    expect(alreadyVote.return?.valueOf()).toEqual(BigInt(1));
  });

  test('should not allow voting twice', async () => {
    await expect(
      appClient.vote(
        {
          inFavor: true,
        },
        {
          sender,
        }
      )
    ).rejects.toThrow();
  });

  test('vote against & getVotesTotal', async () => {
    // Opt-in to the application
    const optMth = appClient.optIn;
    await optMth.optInToApplication({}, { sender: sender2 });

    await appClient.vote(
      {
        inFavor: false,
      },
      {
        sender: sender2,
      }
    );
    const votesAfter = await appClient.getVotesTotal({});
    expect(votesAfter.return?.valueOf()).toEqual([BigInt(2), BigInt(1)]);

    const alreadyVote = await appClient.getAlreadyVote(
      {},
      {
        sender: sender2,
      }
    );
    expect(alreadyVote.return?.valueOf()).toEqual(BigInt(1));
  });
});
