<?php
require_once("db_inc.php");
$mysqli=new mysqli($dbserver,$username,$password,$database);
if (!(mysqli_connect_errno())) {
      $pointarray=explode("-",$_POST['taskdef']);
      $position=array();
      $output=array();
      $output['canshow']="yes";
     $stmt = $mysqli->prepare("SELECT * FROM tpoints WHERE trigraph=?");
     $stmt->bind_param("s", $point);
      $j=0;
      foreach($pointarray as $point)  {
            //$pointinfo=$mysqli->query("SELECT * FROM tpoints WHERE trigraph='".$point."'");
            $stmt->execute();
           $result=$stmt->get_result();
          if($pointdetail=$result->fetch_array())  {
                    $output['names'][]=$pointdetail['tpname'];
                    $position[]= array($pointdetail['latitude'],$pointdetail['longitude']);
                    }
            else  {
                        $output['names'][]="Not found";
                        $output['canshow']="no";
                        $position[]=array(0,0);
                    }
            }
     $stmt->close();
     $mysqli->close();
     $output['takeoff']="";
     $output['landing']="";
    $output['coordinates']=$position;
    echo json_encode($output,JSON_NUMERIC_CHECK);
    }
?>
