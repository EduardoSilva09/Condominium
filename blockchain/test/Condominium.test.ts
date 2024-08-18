import {
  loadFixture, time
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Condominium } from "../typechain-types";
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe("Condominium", function () {
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

  async function deployFixture() {
    const accounts = await ethers.getSigners();
    const manager = accounts[0];
    const resident = accounts[1];

    const Condominium = await ethers.getContractFactory("Condominium");
    const contract = await Condominium.deploy();

    return { contract, manager, resident, accounts };
  }

  function getResidenceId(i: number) {
    const blocks = (1000 * Math.ceil(i / 25));
    const floors = (100 * Math.ceil(i / 5));
    const units = (i - (5 * Math.floor((i - 1) / 5)));
    return blocks + floors + units;
  }

  async function addResidents(contract: Condominium, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      const residenceId = getResidenceId(i);
      await contract.addResident(accounts[i - 1].address, residenceId);
      const instance = contract.connect(accounts[i - 1]);
      await instance.payQuota(residenceId, { value: ethers.parseEther("0.01") });
    }
  }

  async function addVotes(contract: Condominium, count: number, accounts: SignerWithAddress[], shouldApprove: boolean = true) {
    const option: Options = shouldApprove ? Options.YES : Options.NO;
    for (let i = 1; i <= count; i++) {
      const instance = contract.connect(accounts[i - 1])
      await instance.vote("Topico", option);
    }
  }

  it("Should be residence", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    expect(await contract.residenceExists(2102)).to.equal(true);
  });

  it("Should add residet", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should NOT add residet (address)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.addResident(ethers.ZeroAddress, 2102))
      .to.be.revertedWith("Invalid address");
  });

  it("Should NOT add residet (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.addResident(resident.address, 2102))
      .to.be.revertedWith("Only the manager or the counselors can do this")
  });

  it("Should NOT add residet (residence)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.addResident(resident.address, 0))
      .to.be.revertedWith("This residence does not exists")
  });

  it("Should remove residet (first)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await contract.addResident(accounts[1].address, 2102);
    await contract.addResident(accounts[2].address, 2103);
    await contract.setCounselor(accounts[2].address, true);
    await contract.removeResident(accounts[1].address);

    expect(await contract.isResident(accounts[1].address)).to.equal(false);
  });

  it("Should remove residet (latest)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.removeResident(resident.address);

    expect(await contract.isResident(resident.address)).to.equal(false);
  });

  it("Should NOT remove residet (permission) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    const instance = contract.connect(resident);

    await expect(instance.removeResident(resident.address))
      .to.be.revertedWith("Only the manager can do this");
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should NOT remove residet (address) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await expect(contract.removeResident(ethers.ZeroAddress))
      .to.be.revertedWith("Invalid address");
  });

  it("Should set counselor ", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.setCounselor(resident.address, true);

    const instance = contract.connect(resident);
    await instance.addResident(accounts[2].address, 2102);
    const residentInfo = await contract.getResident(resident.address);

    expect(residentInfo.isCounselor).to.equal(true);
    expect(await contract.isResident(accounts[2].address)).to.equal(true);
  });

  it("Should NOT add counselor (address)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.setCounselor(ethers.ZeroAddress, true))
      .to.be.revertedWith("Invalid address");
  });

  it("Should remove counselor (first)", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 3, accounts);
    await contract.setCounselor(accounts[1].address, true);
    await contract.setCounselor(accounts[2].address, true);

    await contract.setCounselor(accounts[1].address, false);
    const residentInfo = await contract.getResident(accounts[1].address);

    expect(residentInfo.isCounselor).to.equal(false);
  });

  it("Should remove counselor (latest)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.setCounselor(resident.address, true);
    await contract.setCounselor(resident.address, false);
    const residentInfo = await contract.getResident(resident.address);

    expect(residentInfo.isCounselor).to.equal(false);
  });

  it("Should NOT remove counselor (address)", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);

    await expect(contract.setCounselor(ethers.ZeroAddress, false))
      .to.be.revertedWith("Invalid address")
  });

  it("Should NOT remove counselor (permission)", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);

    await contract.addResident(accounts[1].address, 2102);

    await contract.setCounselor(accounts[1].address, true);

    const instance = contract.connect(accounts[1]);
    await expect(instance.setCounselor(accounts[1].address, false))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove counselor (exists)", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);

    await expect(contract.setCounselor(accounts[1].address, false))
      .to.be.revertedWith("Counselor not found");
  });

  it("Should NOT add counselor (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    const instance = contract.connect(resident);

    await expect(instance.setCounselor(resident.address, true))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT add counselor (external resident)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.setCounselor(resident.address, true))
      .to.be.revertedWith("The counselor must be a resident");
  });

  it("Should NOT remove residet (counselor) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.setCounselor(resident.address, true);

    await expect(contract.removeResident(resident.address))
      .to.be.revertedWith("A counselor cannot be removed");
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should change manager ", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 15, accounts);
    await contract.addTopic("Topico", "Change manager", Category.CHANGE_MANAGER, 0, resident.address);
    await contract.openVoting("Topico");
    await addVotes(contract, 15, accounts);
    await contract.closeVoting("Topico");
    const topic = await contract.getTopic("Topico");

    expect(topic.status).to.equal(Status.APPROVED);
    expect(await contract.manager()).to.equals(resident.address);
  });

  it("Should change quota ", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 20, accounts);
    const value = ethers.parseEther("0.02");
    await contract.addTopic("Topico", "Change manager", Category.CHANGE_QUOTA, value, manager.address);
    await contract.openVoting("Topico");
    await addVotes(contract, 20, accounts);
    await contract.closeVoting("Topico");

    expect(await contract.monthlyQuota()).to.equals(value);
  });

  it("Should add topic (manager)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    expect(await contract.topicExists("Topico")).to.equal(true);
  });

  it("Should NOT add topic (amount)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.addTopic("Topico", "Topico de testes", Category.DECISION, 10, manager.address))
      .to.be.revertedWith("Wrong category")
  });

  it("Should add topic (resident)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await contract.addResident(resident.address, 2102);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });

    await instance.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    expect(await instance.topicExists("Topico")).to.equal(true);
  });

  it("Should NOT add topic (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address))
      .to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT add topic (Duplicated)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await expect(contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address))
      .to.be.revertedWith("This topic already exists");
  });

  it("Should edit topic (manager)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.SPENT, 2, manager.address);
    await contract.editTopic("Topico", "Topico atualizado", 4, manager.address);

    const topic = await contract.getTopic("Topico");

    expect(topic.description).to.equal("Topico atualizado");
    expect(topic.amount).to.equal(4);
  });

  it("Should edit topic (nothing)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.SPENT, 2, manager.address);
    await contract.editTopic("Topico", "", 0, ethers.ZeroAddress);

    const topic = await contract.getTopic("Topico");

    expect(topic.description).to.equal("Topico de testes");
    expect(topic.amount).to.equal(2);
    expect(topic.responsible).to.equal(manager.address);
  });

  it("Should NOT edit topic (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.SPENT, 2, manager.address);
    const instance = contract.connect(resident)

    await expect(instance.editTopic("Topico", "Topico atualizado", 4, manager.address))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT edit topic (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.SPENT, 2, manager.address);
    await contract.openVoting("Topico");

    await expect(contract.editTopic("Topico", "Topico atualizado", 4, manager.address))
      .to.be.revertedWith("Only IDLE topics can be edited");
  });

  it("Should NOT edit topic (inexistent)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.editTopic("Topico", "Topico atualizado", 4, manager.address))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should remove topic (first)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topic", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.addTopic("topic 1", "description 2", Category.DECISION, 0, manager.address);
    await contract.removeTopic("topic 1");
    expect(await contract.topicExists("topic 1")).to.equal(false);
  });

  it("Should remove topic (latest)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.removeTopic("Topico");
    expect(await contract.topicExists("Topico")).to.equal(false);
  });

  it("Should NOT remove topic (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    const instance = contract.connect(resident);
    await expect(instance.removeTopic("Topico"))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove topic (nonexistent)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.removeTopic("Topico"))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT remove topic (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    await expect(contract.removeTopic("Topico"))
      .to.be.revertedWith("Only IDLE topics can be removed");
  });

  it("Should vote ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });
    await instance.vote("Topico", Options.ABSTENTION);

    expect(await instance.numberOfVotes("Topico")).to.equal(1);
  });

  it("Should NOT vote (duplicated) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });
    await instance.vote("Topico", Options.YES);
    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("A residence should vote only once");
    expect(await instance.numberOfVotes("Topico")).to.equal(1);
  });

  it("Should NOT vote (defaulter) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("The resident must be defaulter");
  });

  it("Should NOT vote (empty vote) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });

    await expect(instance.vote("Topico", Options.EMPTY))
      .to.be.revertedWith("The option cannot be EMPTY");
  });

  it("Should NOT vote (invalid topic) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await contract.addResident(resident.address, 2102);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT vote (status) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    const instance = contract.connect(resident);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("Only VOTING topics can be voted");
  });

  it("Should NOT vote (permission) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    const instance = contract.connect(resident);

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should close voting ", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);

    await addResidents(contract, 6, accounts);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");
    await addVotes(contract, 5, accounts, false);
    const instance = contract.connect(accounts[5])
    await instance.vote("Topico", Options.ABSTENTION);

    await contract.closeVoting("Topico");
    const topic = await contract.getTopic("Topico");

    expect(topic.status).to.equal(Status.DENIED);
  });

  it("Should close voting (minimum votes) ", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");
    await expect(contract.closeVoting("Topico"))
      .to.be.revertedWith("You cannot finish a voting without the minimum votes")
  });

  it("Should NOT close voting (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });
    await instance.vote("Topico", Options.YES);
    await expect(instance.closeVoting("Topico"))
      .to.be.revertedWith("Only the manager can do this");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT close voting (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);

    await expect(contract.closeVoting("Topico"))
      .to.be.revertedWith("Only VOTING topics can be closed");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.IDLE);
  });

  it("Should NOT close voting (invalid topic)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.closeVoting("Topico"))
      .to.be.revertedWith("The topic does not exists");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.DELETED);
  });

  it("Should open voting", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    const instance = contract.connect(resident);
    await expect(instance.openVoting("Topico"))
      .to.be.revertedWith("Only the manager can do this");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.IDLE);
  });

  it("Should NOT open voting (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes", Category.DECISION, 0, manager.address);
    await contract.openVoting("Topico");

    await expect(contract.openVoting("Topico"))
      .to.be.revertedWith("Only IDLE topics can be open for voting");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (inexistent)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.openVoting("Topico"))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should pay quota", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);

    await contract.addResident(accounts[1].address, 2102);

    const instance = contract.connect(accounts[1]);
    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });

    const resident = await contract.getResident(accounts[1].address);

    await time.setNextBlockTimestamp(parseInt(`${(Date.now() / 1000) + (31 * 24 * 60 * 60)}`));

    await instance.payQuota(2102, { value: ethers.parseEther("0.01") });
    const residentAfter = await contract.getResident(accounts[1].address);

    expect(residentAfter.nextPayment).to.equal(resident.nextPayment + BigInt(30 * 24 * 60 * 60));
  });

  it("Should NOT pay quota (residence)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.payQuota(1, { value: ethers.parseEther("0.01") }))
      .to.be.revertedWith("The residence does not exists");
  });

  it("Should NOT pay quota (value)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.payQuota(2102, { value: ethers.parseEther("0.0001") }))
      .to.be.revertedWith("Wrong value");
  });

  it("Should NOT pay quota (duplicated)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.payQuota(1102, { value: ethers.parseEther("0.01") })
    await expect(contract.payQuota(1102, { value: ethers.parseEther("0.01") }))
      .to.be.revertedWith("You cannot pay twice a month");
  });

  it("Should NOT transfer (manager)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.transfer("topic", ethers.parseEther("0.01")))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT transfer (funds)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    const value = ethers.parseEther("0.01");
    await expect(contract.transfer("topic", value))
      .to.be.revertedWith("Insufficient funds");
  });

  it("Should NOT transfer (topic status)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 3, accounts);
    const value = ethers.parseEther("0.01");
    await contract.addTopic("Topico", "description topic teste", Category.SPENT, 10, accounts[1].address)
    await contract.openVoting("Topico");

    await expect(contract.transfer("Topico", value))
      .to.be.revertedWith("Only APPROVED SPENT topics can be used for transfers");
  });

  it("Should NOT transfer (topic category)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 10, accounts);

    const value = ethers.parseEther("0.01");
    await contract.addTopic("Topico", "description topic teste", Category.DECISION, 0, accounts[1].address)
    await contract.openVoting("Topico");
    await addVotes(contract, 10, accounts);
    await contract.closeVoting("Topico");

    await expect(contract.transfer("Topico", value))
      .to.be.revertedWith("Only APPROVED SPENT topics can be used for transfers");
  });

  it("Should NOT transfer (amount)", async function () {
    const { contract, manager, resident, accounts } = await loadFixture(deployFixture);
    await addResidents(contract, 10, accounts);

    const value = ethers.parseEther("0.01");
    await contract.addTopic("Topico", "description topic teste", Category.SPENT, 10, accounts[1].address)
    await contract.openVoting("Topico");
    await addVotes(contract, 10, accounts);
    await contract.closeVoting("Topico");

    await expect(contract.transfer("Topico", value))
      .to.be.revertedWith("The amount must be less or equals the APPROVED topic");
  });

  it("Should get topic", async function () {
    const { contract, manager, accounts } = await loadFixture(deployFixture);

    await contract.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await contract.addTopic("topic 2", "description 2", Category.DECISION, 0, manager.address);

    const topic = await contract.getTopic("topic 2");

    expect(topic.title).to.equal("topic 2");
  });
});
