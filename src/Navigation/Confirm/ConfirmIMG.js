import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './ConfirmIMG.css';
import InstAI_icon from '../../image/instai_icon.png';
import { BounceLoader } from 'react-spinners';
import { Modal, Button } from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";

function ConfirmImg() {
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagePreviews2, setImagePreviews2] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentToUploadPage, setCurrentToUploadPage] = useState(1);
  const [imgsPerPage] = useState(10);
  const [imgType, setImgType] = useState(0);
  

  const searchParams = new URLSearchParams(location.search);
  const id = localStorage.getItem("userId");
  const projectname = searchParams.get("projectname");
  const g_c = process.env.REACT_APP_GET_IMGCOUNT
  const m_i = process.env.REACT_APP_MODIFY_IMGQUANTITY;


  // Get current imgs
  const indexOfLastImg = currentPage * imgsPerPage;
  const indexOfFirstImg = indexOfLastImg - imgsPerPage;
  const currentImgs = imagePreviews.slice(indexOfFirstImg, indexOfLastImg);

  // Get current To Upload imgs
  const indexOfLastToUploadImg = currentToUploadPage * imgsPerPage;
  const indexOfFirstToUploadImg = indexOfLastToUploadImg - imgsPerPage;
  const currentToUploadImgs = imagePreviews2.slice(indexOfFirstToUploadImg, indexOfLastToUploadImg);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  // Change ToUpload page
  const paginateToUpload = (pageNumber) => setCurrentToUploadPage(pageNumber);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState(null);



  const getCount = async (projectname) => {
    try {
      const token = localStorage.getItem('jwtToken');

      const response = await axios.get(`${g_c}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        params: { projectname: projectname, username: id }
      });

      // console.log("response data is", response.data);
      if (response.data === 'error') {
        throw new Error('Error fetching data');
      }
      // console.log(response.data);
      let chance = response.data.img_generation_remaining_count;
      // console.log(chance);
      return chance;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };
  const chance = getCount(projectname);

  const [confirmed2, setConfirmed2] = useState(JSON.parse(localStorage.getItem(`confirmStatusImg_${id}_${projectname}`) || 'false'));

  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const p = process.env;
  const c_s = p.REACT_APP_CONFIRM_STEP;
  const upload_download = p.REACT_APP_UPLOAD_DOWNLOAD;
  const upload_deleteimg = p.REACT_APP_UPLOAD_DELETEIMG;
  const u = process.env.REACT_APP_UPLOAD;
  const confirm_img = p.REACT_APP_AWS_CONFIRM_IMG;
  // console.log("現在狀態", confirmed2);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await axios.get(`${upload_download}?username=${id}&projectname=${projectname}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log(response.data.images);
      setImagePreviews(response.data.images);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching image previews:', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteImage = async (index) => {
    const pn = projectname
    setModalMessage('確定要刪除圖片?');
    setModalCallback(async () => {
      const updatedPreviews = [...imagePreviews];
      const deletedImage = updatedPreviews.splice(index, 1)[0];
  
      setImagePreviews(updatedPreviews);
      try {
        const token = localStorage.getItem("jwtToken");
        await axios.post(`${upload_deleteimg}?username=${id}&projectname=${pn}`, { filename: deletedImage }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        setModalMessage('Delete success');
        setShowModal(true);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    });
    setShowModal(true);
  };
  

  const handleDeletepreviewImage = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...imagePreviews2];
  
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
  
    setSelectedFiles(updatedFiles);
    setImagePreviews2(updatedPreviews);
    setModalMessage("Img deleted!");
    setShowModal(true);
  };
  
  const handleFileSelect = async (event) => {
    const files = event.target.files;
    const fileArray = Array.from(files);

    const allowedFileTypes = ['image/jpeg', 'image/png'];
    const filteredFiles = fileArray.filter((file) =>
      allowedFileTypes.includes(file.type)
    );

    setSelectedFiles((prevFiles) => [...prevFiles, ...filteredFiles]);

    try {
      const previews = filteredFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews2((prevPreviews) => [...prevPreviews, ...previews]);
    } catch (error) {
      console.error('Error:', error);
    }
    setImgType(1);
  };

  const handleConfirmButtonClick = () => {
    console.log('handleConfirmButtonClick triggered');

    if (confirmed2) {
      console.log("取消確認狀態");
      handleCancelConfirmation();
      changeStep("Image Confirmation");
    }
    else {
      console.log("確認狀態");
      handleConfirmRequirement();
      changeStep("Requirement confirmation");
    }
  };
  const handleCancelConfirmation = () => {
    setModalMessage('Are you sure you want to cancel the confirmation?');
    setModalCallback(() => {
      localStorage.setItem(`confirmStatusImg_${id}_${projectname}`, 'false');
      setConfirmed2(false);
    });
    setShowModal(true);
  };
  
  const handleConfirmRequirement = () => {
    setModalMessage('Are you sure you want to confirm the Imgs?');
    setModalCallback(() => {
      localStorage.setItem(`confirmStatusImg_${id}_${projectname}`, 'true');
      setConfirmed2(true);
    });
    setShowModal(true);
  };
  const handleGoBack = () => {
    if (!confirmed2) {
      setModalMessage('You have not confirmed the Imgs. Are you sure you want to go back?');
      setModalCallback(() => {
        navigate(`/Step?project=${projectname}`);
      });
      setShowModal(true);
    } else {
      setModalMessage('Back to step page');
      setShowModal(true);
      setModalCallback(() => {
        navigate(`/Step?project=${projectname}`);
      });
    }
  };
  

  const changeStep = async (status_now) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const formData = { step: status_now, projectname: projectname, username: id };
      const response = await axios.post(
        `${c_s}`, formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      // console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setModalMessage('請選擇要上傳的圖片!');
      setShowModal(true);
    }
    else {
      setModalMessage('確定要新增圖片?');
      setModalCallback(async () => {
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; ++i) {
          formData.append('file', selectedFiles[i]);
        }
  
        try {
          const token = localStorage.getItem('jwtToken');
          const response = await axios.post(
            `${u}?username=${id}&projectname=${projectname}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setModalMessage('Upload success');
          setShowModal(true);
          setSelectedFiles([]);
          setImagePreviews2([]);
          fetchData();
        } catch (error) {
          console.error('Error uploading data:', error);
        }
  
        try {
          const token = localStorage.getItem('jwtToken');
          const formData2 = { quantity : imagePreviews.length + imagePreviews2.length , username : id , projectname : projectname};
          const response3 = await axios.post(
            `${m_i}/?step=1&username=${id}&projectname=${projectname}`,
            formData2,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
          
          console.log(response3.data);
        } catch (error) {
          console.error('Error updating img quantity:', error);
        }
        setImgType(0)
      });
      setShowModal(true);
    }
  };
  

  const handleChangeToUpload = async () => {
    setImgType(1)
    console.log(imgType)
  }

  const handleChangeUploaded = async () => {
    setImgType(0)
    console.log(imgType)
  }



  return (

    // <div className="review-container">
    <div className="container-fluid p-0 mt-3">

      <div className="row d-flex justify-content-between ">
        <div className="col-auto">
          <img src={InstAI_icon} className="img-fluid" alt="InstAi_Icon" style={{ width: '76.8px', height: '76.8px' }} ></img>
        </div>
        <div className="border custom-border"></div>
      </div>


      <div className='container-fluid bg-light p-0 border-top' style={{ height: '100vh' }}>

        <div className='container border border-3 custom-border rounded mt-5'>
          <div className={`card  confirmform`} style={{ height: 100 }}>
            <h1 className="display-4  text-center create-title text-light" style={{ fontWeight: 'bold' }}>Image Preview</h1>
          </div>

          {loading ? (
            <div>
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <BounceLoader color={'black'} size={120} />
              </div>
            </div>) : (

            <div>
              <div className='rol mb-3 ms-3 '>
                <div className={imgType === 0  ? 'btn btn-primary me-2' : 'btn btn-secondary me-2'} onClick={handleChangeUploaded}>Uploaded</div>
                <div className={imgType === 1  ? 'btn btn-primary me-2' : 'btn btn-secondary me-2'} onClick={handleChangeToUpload}>To Upload</div>
              </div>
              <div className="container image-previews">



                <div className='row row-cols-5 gy-5 justify-content-between' >
                  {imgType === 0 ?
                    currentImgs.map((preview, index) => (
                      <div className='col' key={index}>
                        <div className='card text-bg-light' style={{ width: "250px", height: "200px" }}>
                          <div className='card-header'>No.{(currentPage-1)*10+index + 1}</div>
                          <img
                            className='card-img-top mt-1'
                            src={`${confirm_img}/${preview}`}
                            alt={`image ${index}`}
                            style={{ width: 'auto', height: '150px' }}
                            loading="lazy"
                          />
                          {!confirmed2 && <button className="delete-button" onClick={() => handleDeleteImage(index)}>
                            Delete
                          </button>}
                        </div>
                      </div>
                    )) : currentToUploadImgs.map((preview, index) => (

                      <div className='col'>

                        <div className='card text-bg-light' style={{ width: "250px", height: "200px" }}>
                          <div className='card-header'>欲新增的No.{(currentToUploadPage-1)*10+index + 1}</div>
                          <img
                            className='card-img-top mt-1'
                            src={preview}
                            alt={`image ${index}`}
                            style={{ width: 'auto', height: '150px' }}
                            loading="lazy"
                          />
                          {!confirmed2 ? <button className="delete-button" onClick={() => handleDeletepreviewImage(index)}>
                            Delete
                          </button> : <></>}
                        </div>

                      </div>



                    ))}
                  {/* {currentImgs.map((preview, index) => (

                    <div className='col'>

                      <div className='card text-bg-light' style={{ width: "250px", height: "200px" }}>
                        <div className='card-header'>No.{index + 1}</div>
                        <img
                          className='card-img-top mt-1'
                          src={`${confirm_img}/${preview}`}
                          alt={`image ${index}`}
                          style={{ width: 'auto', height: '150px' }}
                          loading="lazy"
                        />
                        {!confirmed2 ? <button className="delete-button" onClick={() => handleDeleteImage(index)}>
                          Delete
                        </button> : false}
                      </div>

                    </div>
                  ))} */}

                  { }

                </div>


              </div>


              {imgType === 0 ? <ul className="pagination justify-content-center  mt-5">
                <li className="page-item">
                  <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: Math.ceil(imagePreviews.length / imgsPerPage) }).map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button onClick={() => paginate(i + 1)} className="page-link " >{i + 1}</button>
                  </li>
                ))}
                <li className="page-item">
                  <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === Math.ceil(imagePreviews.length / imgsPerPage)}>
                    &raquo;
                  </button>
                </li>
              </ul> :
               <ul className="pagination justify-content-center  mt-5">
                <li className="page-item">
                  <button className="page-link" onClick={() => paginateToUpload(currentToUploadPage - 1)} disabled={currentToUploadPage === 1}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: Math.ceil(imagePreviews2.length / imgsPerPage) }).map((_, i) => (
                  <li key={i} className={`page-item ${currentToUploadPage === i + 1 ? 'active' : ''}`}>
                    <button onClick={() => paginateToUpload(i + 1)} className="page-link " >{i + 1}</button>
                  </li>
                ))}
                <li className="page-item">
                  <button className="page-link" onClick={() => paginateToUpload(currentToUploadPage + 1)} disabled={currentToUploadPage === Math.ceil(imagePreviews2.length / imgsPerPage)}>
                    &raquo;
                  </button>
                </li>
              </ul>


              }




              <div className=" d-flex mt-4 mb-3 justify-content-center ">
                <button
                  onClick={handleConfirmButtonClick}
                  className={confirmed2 ? "btn lg btn-success" : "btn lg btn-danger"}
                  disabled={confirmed2 ? true : false}
                >
                  {confirmed2 ? 'Confirmed' : 'Confirm'}
                </button>
              </div>

              <div className="mt-3 mb-3 custom-border"></div>



              <div className=" d-flex mt-2 mb-3 justify-content-between ">
                <div className="col-4">
                  {!confirmed2 ? <input type="file" accept="image/*" multiple name="images" onChange={handleFileSelect} /> : <></>}
                </div>
                <div className="col-8 d-flex  justify-content-end">
                  <div >
                    {!confirmed2 ? <button className='btn btn-warning me-3' onClick={handleUpload} >Additional Upload</button> : <></>}
                    {/* <button onClick={handleUpload} disabled = {confirmed2 ? true : false}>Change</button> */}
                  </div>
                  {/* <div>
                    {chance !== 0 ? (
                      <>
                        <button className='btn confirmButton ' style={{ marginRight: '15px' }} onClick={handleSDlogic}>use model to generate img</button>
                      </>) : (
                      <>
                      </>)}

                  </div> */}

                  <div >
                    <button className='btn confirmButton ' onClick={handleGoBack}>Go Back</button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton className="d-flex justify-content-between">
    <Modal.Title></Modal.Title>
    <img src={instAI_newicon} alt="InstAI Icon" style={{ width: '170px', height: '58px', marginLeft: "140px" }} />
  </Modal.Header>
  <Modal.Body className="text-center">{modalMessage}</Modal.Body>
  <Modal.Footer className="justify-content-center">
    <Button variant="secondary" onClick={() => setShowModal(false)} className="mr-2">
      NO
    </Button>
    {modalCallback && (
      <Button variant="primary" onClick={() => { modalCallback(); setShowModal(false); }} className="ml-2">
        OK
      </Button>
    )}
  </Modal.Footer>
</Modal>


    </div>
  );
}

export default ConfirmImg;