import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { CondominiumAdapter } from "../typechain-types";
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe("CondominiumAdapter", function () {
  enum Options {
    EMPTY,
    YES,
    NO,
    ABSTENTION
  }

  enum Status {
    IDLE,
    VOTING,
    APPROVED,
    DENIED,
    DELETED,
    SPENT
  }

  enum Category {
    DECISION,
    SPENT,
    CHANGE_QUOTA,
    CHANGE_MANAGER
  }

  async function deployAdapterFixture() {
    const accounts = await hre.ethers.getSigners();
    const manager = accounts[0];

    const CondominiumAdapter = await hre.ethers.getContractFactory("CondominiumAdapter");
    const adapter = await CondominiumAdapter.deploy();

    return { adapter, accounts, manager };
  }

  async function deployImplementationFixture() {
    const Condominium = await hre.ethers.getContractFactory("Condominium");
    const contract = await Condominium.deploy();

    return { contract };
  }

  function getResidenceId(i: number) {
    const blocks = (1000 * Math.ceil(i / 25));
    const floors = (100 * Math.ceil(i / 5));
    const units = (i - (5 * Math.floor((i - 1) / 5)));
    return blocks + floors + units;
  }

  async function addResidents(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    const skip = count < 20 ? 0 : 1;
    for (let i = 1; i <= count; i++) {
      const residenceId = getResidenceId(i);
      await adapter.addResident(accounts[i - skip].address, residenceId);

      const instance = adapter.connect(accounts[i - skip]);
      await instance.payQuota(residenceId, { value: ethers.parseEther("0.01") });
    }
  }

  async function addVotes(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[], shouldApprove: boolean = true) {
    const option: Options = shouldApprove ? Options.YES : Options.NO;
    const skip = count < 20 ? 0 : 1;
    for (let i = 1; i <= count; i++) {
      const instance = adapter.connect(accounts[i - skip]);
      await instance.vote("topic", option);
    }
  }

  it("Should upgrade", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    const address = await adapter.getImplementationAddress();

    expect(await contract.getAddress()).to.equal(address);
  });

  it("Should NOT upgrade (permission)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);
    const instance = adapter.connect(accounts[1]);
    const address = await contract.getAddress();
    await expect(instance.upgrade(address))
      .to.be.revertedWith("You do not have permission");
  });

  it("Should add resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    expect(await contract.isResident(accounts[1].address)).to.equal(true);
  });

  it("Should NOT add resident (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.addResident(accounts[1].address, 2102))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should remove resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    await adapter.removeResident(accounts[1].address);

    expect(await contract.isResident(accounts[1].address)).to.equal(false);
  });

  it("Should NOT remove resident (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.removeResident(accounts[1].address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should set counselor ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.setCounselor(accounts[1].address, true)
    const resident = await adapter.getResident(accounts[1].address);

    expect(resident.isCounselor).to.equal(true);
  });

  it("Should NOT set counselor (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.setCounselor(accounts[1].address, true))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should add topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address);

    expect(await contract.topicExists("topic")).to.equal(true);
  });

  it("Should NOT add topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should edit topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.SPENT, 1, manager.address);
    await adapter.editTopic("topic", "description topic teste atualizada", 3, manager.address);
    const topic = await contract.getTopic("topic");
    expect(topic.amount).to.equal(3);
    expect(topic.description).to.equal("description topic teste atualizada");
  });

  it("Should NOT edit topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.editTopic("topic", "description topic teste atualizada", 3, manager.address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should remove topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.removeTopic("topic")

    expect(await contract.topicExists("topic")).to.equal(false);
  });

  it("Should NOT remove topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.removeTopic("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should open voting ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    const topic = await contract.getTopic("topic");

    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.openVoting("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should vote ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    const instance = adapter.connect(accounts[1])
    await instance.payQuota(1301, { value: ethers.parseEther("0.01") });

    await instance.vote("topic", Options.YES);
    expect(await contract.numberOfVotes("topic")).to.equal(1);
  });

  it("Should NOT vote (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.vote("topic", Options.YES))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should close voting (DECISION APPROVED)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 5, accounts);

    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 5, accounts);
    await expect(adapter.closeVoting("topic"))
      .to.emit(adapter, "TopicChanged");

    const topic = await contract.getTopic("topic");
    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should close voting (DECISION DENIED)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 5, accounts);

    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 5, accounts, false);

    await expect(adapter.closeVoting("topic"))
      .to.emit(adapter, "TopicChanged");

    const topic = await contract.getTopic("topic");
    expect(topic.status).to.equal(Status.DENIED);
  });

  it("Should close voting (CHANGE_MANAGER, resident)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 15, accounts);

    await adapter.addTopic("topic", "description topic teste", Category.CHANGE_MANAGER, 0, accounts[1].address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 15, accounts);
    await expect(adapter.closeVoting("topic"))
      .to.emit(adapter, "ManagerChanged")
      .withArgs(accounts[1].address);
  });

  it("Should close voting (CHANGE_MANAGER)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 15, accounts);
    const externalManager = accounts[19].address;

    await adapter.addTopic("topic", "description topic teste", Category.CHANGE_MANAGER, 0, externalManager)
    await adapter.openVoting("topic");
    await addVotes(adapter, 15, accounts);
    await expect(adapter.closeVoting("topic"))
      .to.emit(adapter, "ManagerChanged")
      .withArgs(externalManager);
  });

  it("Should close voting (CHANGE_QUOTA)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 20, accounts);
    const newValue = 100;
    await adapter.addTopic("topic", "description topic teste", Category.CHANGE_QUOTA, newValue, manager.address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 20, accounts);
    await expect(adapter.closeVoting("topic"))
      .to.emit(adapter, "QuotaChanged")
      .withArgs(newValue);
  });

  it("Should NOT close voting (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.closeVoting("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should NOT pay quota (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.payQuota(1102, { value: ethers.parseEther("0.01") }))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should NOT upgrade (address) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.upgrade(ethers.ZeroAddress))
      .to.be.revertedWith("Invalid address");
  });

  it("Should transfer ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 10, accounts);

    const value = ethers.parseEther("0.01");
    await adapter.addTopic("topic", "description topic teste", Category.SPENT, value, accounts[1].address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 10, accounts);
    await adapter.closeVoting("topic");
    const balanceBefore = await ethers.provider.getBalance(await contract.getAddress());
    const balanceWorkerBefore = await ethers.provider.getBalance(accounts[1].address);
    await adapter.transfer("topic", value);
    const balanceWorkerAfter = await ethers.provider.getBalance(accounts[1].address);
    const balanceAfter = await ethers.provider.getBalance(await contract.getAddress());

    const topic = await contract.getTopic("topic");

    expect(balanceAfter).to.equal(balanceBefore - value);
    expect(balanceWorkerAfter).to.equal(balanceWorkerBefore + value);
    expect(topic.status).to.equal(Status.SPENT);
  });

  it("Should NOT transfer (amount) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.transfer("topic", ethers.parseEther("0.01")))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should get residents ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    const address = await contract.getAddress();
    await adapter.upgrade(address);

    await adapter.addResident(accounts[1].address, 1301);

    const result = await adapter.getResidents(1, 10);

    expect(result.residents[0].wallet).to.equal(accounts[1].address);
  });

  it("Should NOT get residents (upgrade)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    await expect(adapter.getResidents(1, 10))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should get topic", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    const address = await contract.getAddress();
    await adapter.upgrade(address);

    await adapter.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);

    const topic = await adapter.getTopic("topic 1");

    expect(topic.title).to.equal("topic 1");
  });

  it("Should NOT get topic (upgrade)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.getTopic("topic 1"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should get topics", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    const address = await contract.getAddress();
    await adapter.upgrade(address);

    await adapter.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);

    const result = await adapter.getTopics(1, 10);

    expect(result.topics[0].title).to.equal("topic 1");
  });

  it("Should get topics (empty)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    const address = await contract.getAddress();
    await adapter.upgrade(address);
    const result = await adapter.getTopics(1, 10);

    expect(result.topics.length).to.equal(10);
  });

  it("Should NOT get topics (upgrade)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    await expect(adapter.getTopics(1, 10))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should get votes", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    const address = await contract.getAddress();
    await adapter.upgrade(address);

    await addResidents(adapter, 2, accounts);
    await adapter.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await adapter.openVoting("topic 1");

    const instance = adapter.connect(accounts[1]);
    await instance.vote("topic 1", Options.YES);
    const votes = await adapter.getVotes("topic 1");

    expect(votes.length).to.equal(await contract.numberOfVotes("topic 1"));
  });

  it("Should NOT get votes (upgrade)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.getVotes("topic 1"))
      .to.be.revertedWith("You must upgrade first");
  });

});
