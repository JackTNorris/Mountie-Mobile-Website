# Mountie-Mobile-Website

<h4>Description</h4>

This is the Mountie Mobile Website, designed and developed <b>solely</b> by Jack Norris. It's a little ghetto, but hey, it's not really client facing (it's for the adminstrators). With this website, you can submit events and announcements for approval from the school and have them appear on the Mountie Mobile App. It's poorly designed in messy, but I've improved immensely since making this

<p align="center"><kbd><img src = "https://media.giphy.com/media/KGBiQ1NUFLVkF8rmMd/giphy.gif"/></kbd></p>

<h4>Features:</h4>
<ul>
  <li>Secure login through the use of Firebase</li>
  <li>Admin user privileges</li>
  <li>Add events to Mountie Mobile App directly from website</li>
  <li>Send out push notification announcements to Mountie Mobile users</li>
  <li>Edit events</li>
 </ul>

Link (not really much use w/out login):  https://mountie-mobile.firebaseapp.com

Using Firebase for my database and NodeJS for my backend

Note: Yes, I know that it's messy, and that I'm kind of an idiot for not using a framework and putting practically all my backend code in index.js. I didn't know a lot coming into this project, so some of the code is definitely going to be a bit messy. I'm currently working on a version that has a clean backend architecture and used Angular for the frontend. My implementation of dynamic webpages is straight wack bc I'd only done backend programming with C++, and I wasn't crazy familiar with the XMMHTTPRequest api already provided in JavaScript

<h3>A full list of things wrong with this code (and to improve)</h3>
<ul>
  <li>I didn't use a framework, despite multiple good choices existing to make this process easier & cleaner</li>
  <li>Inline styling for html files</li>
  <li>Didn't seperate business logic from http endpoints</li>
  <li>Too much configuration in index.js</li>
  <li>Everything is in the index.js</li>
  <li>Was an idiot and didn't leverage client side api's to render dynamic data with javascript</li>
</ul>
