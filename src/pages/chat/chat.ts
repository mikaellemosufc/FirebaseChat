import { ChatService } from './../../providers/chat.service';
import { Chat } from './../../models/chat.model';
import { FirebaseObjectObservable } from 'angularfire2';
import { MessageService } from './../../providers/message.service';
import { Message } from './../../models/message.model';
import { FirebaseListObservable } from 'angularfire2';
import { UserService } from './../../providers/user.service';
import { User } from './../../models/user.model';
import { AuthService } from './../../providers/auth.service';
import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content } from 'ionic-angular';
import firebase from 'firebase';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {

  @ViewChild(Content) content : Content;
  messages : FirebaseListObservable<Message[]>;
  pageTitle : string;
  sender : User;
  recipient : User;
  limitMessages : number = 30;
  private chat1: FirebaseObjectObservable<Chat>;
  private chat2: FirebaseObjectObservable<Chat>

  constructor(
    public authService : AuthService,
    public chatService: ChatService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService : UserService,
    public messageService: MessageService) {
  }

  ionViewCanEnter() : Promise<boolean> {
    return this.authService.authenticated;
  }
  
  ionViewDidLoad() {
    this.recipient = this.navParams.get('recipientUser');
    this.pageTitle = this.recipient.name;

    this.userService.currentUser.first().subscribe((currentUser : User) => {
      this.sender = currentUser;

      this.chat1 = this.chatService.getDeepChat(this.sender.$key, this.recipient.$key);
      this.chat2 = this.chatService.getDeepChat(this.recipient.$key, this.sender.$key);

      let doSubscribe = () => {
        this.messages
          .subscribe((messages: Message[]) => {
            this.scrollToBottom();
          });
      };

      this.messages = this.messageService
        .getMessages(this.sender.$key, this.recipient.$key, this.limitMessages);
      
      this.messages
        .first()
        .subscribe((messages: Message[]) => {
          if(messages.length === 0) {
            this.messages = this.messageService
              .getMessages(this.recipient.$key, this.sender.$key, this.limitMessages);

            doSubscribe();
          } else {
          doSubscribe();
          }
        })
  });
    
  }

  sendMessage(newMessage : string) : void {
    if(newMessage){
      let currentTimestamp : Object = firebase.database.ServerValue.TIMESTAMP;

      this.messageService.create(
        new Message(
          this.sender.$key, 
          newMessage, 
          currentTimestamp), this.messages
      ).then(() => {
        this.chat1.update({lastMessage: newMessage, timestamp: currentTimestamp});

        this.chat2.update({lastMessage: newMessage, timestamp: currentTimestamp});
      });
    
    }
  }

  private scrollToBottom(duration? : number): void {
    setTimeout(() => {
      if(this.content){
        this.content.scrollToBottom(duration || 300);
      }
    }, 50) 
  }

  doInfinite(infiniteScroll) {
    console.log('Begin async operation', this.messages[20]);

    setTimeout(() => {
      this.limitMessages += 30;
      this.messages = this.messageService
        .getMessages(this.sender.$key, this.recipient.$key, this.limitMessages);

      infiniteScroll.complete();
    }, 500)
  }
}
