import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import Alert from "../../components/Alert";
import { useLocation, useNavigate } from "react-router-dom";
import { getResidents, removeResidents, Resident } from "../../services/Web3Service";
import ResidentRow from "../../components/ResidentRow";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import { ethers } from "ethers";
import { deleteApiResident } from "../../services/APIService";

function Residents() {
  const [residents, setResidents] = useState<Resident[]>();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [count, setCount] = useState<ethers.BigNumberish>(0);
  const navigate = useNavigate();

  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }
  const query = useQuery();

  useEffect(() => {
    setIsLoading(true);
    const queryPage = parseInt(query.get("page") || "1");
    getResidents(queryPage)
      .then(result => {
        setResidents(result.residents);
        setCount(result.total)
        setIsLoading(false);
      })
      .catch(err => {
        setMessage(err.message)
        setIsLoading(false);
      });
    const tx = query.get("tx");
    if (tx) {
      setMessage("Your transactions is being processed. It may takes some minutes to have effect.");
    }
  }, [])

  function onDeleteResident(wallet: string) {
    setIsLoading(true);
    setMessage('');
    setError('');
    const promiseOnChain = removeResidents(wallet);
    const promiseOffChain = deleteApiResident(wallet);
    Promise.all([promiseOnChain, promiseOffChain])
      .then(results => {
        navigate(`/residents?tx=${results[0].hash}`);
        setIsLoading(false);
      })
      .catch(err => {
        setMessage(err.message)
        setIsLoading(false);
      });
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
                      <i className="material-icons opacity-10 me-2">group</i>
                      Residents
                    </h6>
                  </div>
                </div>
                <div className="card-body px-0 pb-2">
                  {
                    message ? <Alert alertClass="alert-success" materialIcon="thumb_up_off_alt" title="Success!" text={message} /> : <></>
                  }
                  {
                    error ? <Alert alertClass="alert-danger" materialIcon="error" title="Error!" text={error} /> : <></>
                  }
                  {
                    isLoading
                      ? <Loader />
                      : <></>
                  }
                  <div className="table-responsive p-0">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Wallet</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Residence</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Is Counselor?</th>
                          <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Next Payment</th>
                          <th className="text-secondary opacity-7"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          residents && residents.length
                            ? residents.map(resident =>
                              <ResidentRow
                                key={resident.wallet}
                                data={resident}
                                onDelete={() => { onDeleteResident(resident.wallet) }} />)
                            : <></>
                        }
                      </tbody>
                    </table>
                    <Pagination count={count} pageSize={10} />
                  </div>
                  <div className="row ms-2">
                    <div className="col-md-12 mb-3">
                      <a className="btn bg-gradient-dark me-2" href="/residents/new">
                        <i className="material-icons opacity-10 me-2">add</i>
                        Add New Resident
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div >
      </main >
    </>
  )

}

export default Residents;