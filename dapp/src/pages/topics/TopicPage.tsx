import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import { getTopic, Topic, Status, Vote, Category, addTopic, editTopic, isManager, openVoting, closeVoting, getVotes, vote, Options } from "../../services/Web3Service";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import { ethers } from "ethers";
import TopicCategory from "../../components/TopicCategory";
import TopicFiles from "./TopicFiles";

function TopicPage() {

  let { title } = useParams();
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [topic, setTopic] = useState<Topic>({} as Topic);
  const [votes, setVotes] = useState<Vote[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (title) {
      setIsLoading(true);
      getTopic(title)
        .then(topic => {
          const { title, description, category, amount, responsible, status, createdDate, startDate, endDate } = topic;
          setTopic({ title, description, category, amount, responsible, status: parseInt(`${status}`), createdDate, startDate, endDate })
          if (topic.status === Status.VOTING)
            return getVotes(topic.title);
          else
            setIsLoading(false);
        }).then(votes => {
          setVotes(votes || []);
          setIsLoading(false);
        })
        .catch(err => {
          setMessage(err.message)
          setIsLoading(false);
        });
    } else {
      topic.responsible = localStorage.getItem("account") || ""
    }
  }, [])

  function onTopicChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = evt.target;
    setTopic(prevState => ({ ...prevState, [id]: value }));
  }

  function btnSaveClick() {
    if (topic) {
      setMessage("Connecting to wallet...wait...");
      if (!title) {
        addTopic(topic)
          .then(tx => navigate(`/topics?tx=${tx.hash}`))
          .catch(err => setMessage(err.message))
      }
      else {
        editTopic(title, topic.description, topic.amount, topic.responsible)
          .then(tx => navigate(`/topics?tx=${tx.hash}`))
          .catch(err => setMessage(err.message));
      }
    }
  }

  function getDate(timestamp: ethers.BigNumberish | undefined) {
    return timestamp
      ? new Date(ethers.toNumber(timestamp) * 1000).toDateString()
      : "";
  }

  function getStatus() {
    switch (topic.status) {
      case Status.VOTING: return "VOTING";
      case Status.APPROVED: return "APPROVED";
      case Status.DENIED: return "DENIED";
      case Status.DELETED: return "DELETED";
      case Status.SPENT: return "SPEN";

      default: return "IDLE"
    }
  }

  function isClosed(): boolean {
    const status = parseInt(`${topic.status || 0}`);
    return [Status.APPROVED, Status.DENIED, Status.DELETED, Status.SPENT].includes(status);
  }

  function isDisabled() {
    return !!title && (topic.status !== Status.IDLE || !isManager());
  }

  function showResponsible(): boolean {
    const category = parseInt(`${topic.category}`);
    return [Category.SPENT, Category.CHANGE_MANAGER].includes(category);
  }

  function showAmount(): boolean {
    const category = parseInt(`${topic.category}`);
    return [Category.SPENT, Category.CHANGE_QUOTA].includes(category);
  }

  function getAmount(): string {
    return topic.amount ? topic.amount.toString() : "0";
  }

  function btnOpenVoteClick() {
    if (topic && title) {
      setMessage("Connecting to Metamask... Wait...")
      openVoting(title)
        .then(tx => { navigate(`/topics?tx=${tx.hash}`) })
        .catch(err => {
          setMessage(err.message)
        })
    }
  }

  function btnCloseVoteClick() {
    if (topic && title) {
      setMessage("Connecting to Metamask... Wait...")
      closeVoting(title)
        .then(tx => { navigate(`/topics?tx=${tx.hash}`) })
        .catch(err => {
          setMessage(err.message)
        })
    }
  }

  function showVoting(): boolean {
    return ![Status.DELETED, Status.IDLE].includes(topic.status || Status.DELETED) && votes && votes.length > 0;
  }

  function alreadyVoted(): boolean {
    return !!(votes && votes.length && votes.find(v => v.resident.toUpperCase() === (localStorage.getItem("account") || "").toUpperCase()));
  }

  function btnVoteClick(option: Options) {
    setMessage("Connecting to MetaMask...wait...");
    if (topic && topic.status === Status.VOTING && title) {
      let text = "";
      switch (option) {
        case Options.YES: text = "YES"; break;
        case Options.NO: text = "NO"; break;
        default: text = "ABSTENTION";
      }

      if (window.confirm(`Are you sure to vote as ${text}?`)) {
        vote(title, option)
          .then(tx => navigate("/topics?tx=" + tx.hash))
          .catch(err => setMessage(err.message));
      }
      else
        setMessage("");
    }
  }

  return (
    <>
      <Sidebar />
      <main className="main-content position-relative max-height-vh-100 h-100 border-radius-lg ">
        <div className="container-fluid py-4">
          <div className="row">
            <div className="col-12">
              <div className="card my-4">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bg-gradient-primary shadow-primary border-radius-lg pt-4 pb-3">
                    <h6 className="text-white text-capitalize ps-3">
                      <i className="material-icons opacity-10 me-2">interests</i>
                      {title ? "Edit" : "New"} Topic
                    </h6>
                  </div>
                </div>
                <div className="card-body px-0 pb-2">
                  {
                    isLoading ? <Loader /> : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="title"
                            value={topic.title || ""}
                            placeholder="Would be great..."
                            onChange={onTopicChange}
                            disabled={!!title}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="description"
                            value={topic.description || ""}
                            placeholder="..."
                            onChange={onTopicChange}
                            disabled={isDisabled()}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  {
                    title ?
                      (
                        <div className="row ms-3">
                          <div className="col-md-6 mb-3">
                            <div className="form-group">
                              <label htmlFor="status">Status:</label>
                              <div className="input-group input-group-outline">
                                <input className="form-control" type="text" id="status"
                                  value={getStatus()}
                                  disabled={true}
                                ></input>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="category">Category:</label>
                        <div className="input-group input-group-outline">
                          <TopicCategory value={topic.category} onChange={onTopicChange} disabled={!!title} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {
                    showResponsible() ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="responsible">Responsible:</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="text" id="responsible"
                                value={topic.responsible || ""}
                                placeholder="0x00..."
                                onChange={onTopicChange}
                                disabled={isDisabled()}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    showAmount() ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="amount">Amount (wei):</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="number" id="amount"
                                value={getAmount()}
                                placeholder="0"
                                onChange={onTopicChange}
                                disabled={isDisabled()}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    title ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="createdDate">Created Date:</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="text" id="createdDate"
                                value={getDate(topic.createdDate)}
                                disabled={true}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    isClosed() || topic.status === Status.VOTING ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="startDate">Start Date:</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="text" id="startDate"
                                value={getDate(topic.startDate)}
                                disabled={true}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    isClosed() ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="endDate">End Date:</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="text" id="endDate"
                                value={getDate(topic.endDate)}
                                disabled={true}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    showVoting() ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="voting">Voting:</label>
                            <div className="input-group input-group-outline">
                              <input className="form-control" type="text" id="voting"
                                value={`${votes.length} votes (${votes.filter(v => v.option === Options.YES).length} YES)`}
                                disabled={true}
                              ></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-12 mb-3">
                      {
                        !title || (isManager() && topic.status === Status.IDLE) ?
                          (
                            <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                              <i className="material-icons opacity-10 me-2">save</i>
                              Save Topic
                            </button>)
                          : <></>
                      }
                      {
                        (isManager() && topic.status === Status.IDLE) ?
                          (
                            <button className="btn btn-success me-2" onClick={btnOpenVoteClick}>
                              <i className="material-icons opacity-10 me-2">lock_open</i>
                              Open Voting
                            </button>)
                          : <></>
                      }
                      {
                        (isManager() && topic.status === Status.VOTING) ?
                          (
                            <button className="btn btn-danger me-2" onClick={btnCloseVoteClick}>
                              <i className="material-icons opacity-10 me-2">lock</i>
                              Close Voting
                            </button>)
                          : <></>
                      }
                      {
                        !isManager() && topic.status === Status.VOTING && !alreadyVoted()
                          ? (
                            <button className="btn btn-success me-2" onClick={() => btnVoteClick(Options.YES)}>
                              <i className="material-icons opacity-10 me-2">thumb_up</i>
                              Vote Yes
                            </button>
                          )
                          : <></>
                      }
                      {
                        !isManager() && topic.status === Status.VOTING && !alreadyVoted()
                          ? (
                            <button className="btn btn-warning me-2" onClick={() => btnVoteClick(Options.ABSTENTION)}>
                              <i className="material-icons opacity-10 me-2">thumbs_up_down</i>
                              Don't Vote
                            </button>
                          )
                          : <></>
                      }
                      {
                        !isManager() && topic.status === Status.VOTING && !alreadyVoted()
                          ? (
                            <button className="btn btn-danger me-2" onClick={() => btnVoteClick(Options.NO)}>
                              <i className="material-icons opacity-10 me-2">thumb_down</i>
                              Vote Yes
                            </button>
                          )
                          : <></>
                      }
                      <span className="text-danger">{message}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {
            title ? <TopicFiles title={title} status={topic.status} /> : <></>
          }
          <Footer />
        </div>
      </main >
    </>
  )
}

export default TopicPage;