<?php
//database access held in seperate file, for security and portability
require_once("db_inc.php");

//creates connection object pointing to database
$mysqli=new mysqli($dbserver,$username,$password,$database);

//splits submitted string:
$pointarray=explode("-",$_POST['taskdef']);
$position=array();
$output=array();
$j=0;
foreach($pointarray as $point)  {
            $pointinfo=$mysqli->query("SELECT * FROM tpoints WHERE trigraph='".$point."'");
          //fetches associative array:
          if( $pointdetail=$pointinfo->fetch_assoc())  {
                    $output['names'][]=$pointdetail['tpname'];
                    $position[]= array($pointdetail['latitude'],$pointdetail['longitude']);
                    }
            else  {
                        $output['names'][]="Not found";
                        $position[]=array(0,0);
                    }
            $pointinfo->close();
            }
$mysqli->close();
$output['coordinates']=$position;
//flag ensures no quotes round anything that looks like a number
echo json_encode($output,JSON_NUMERIC_CHECK);
?>
