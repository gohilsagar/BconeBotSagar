/**
 * Created by sagar.gohil on 18-04-2017.
 */
var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: '24ac1657-cd00-4df0-9629-41a6fd555387',
    appPassword:'YxbQYBFgU01MiKJdLHgXm0R'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================


bot.on('conversationUpdate', function (message) {
    console.log("Called Conversation updated");
    if (message.membersAdded && message.membersAdded.length > 0) {
        var isSelf = false;
        var membersAdded = message.membersAdded
            .map(function (m) {
                isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');
        if (!isSelf) {
            console.log("not self");
            bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + membersAdded + "! I am VendorBot! How can I help you?"));
            bot.beginDialog(message.address,'/');
        }
    }
});


// Root dialog for entry point in application
bot.dialog('/', [
    function (session, results) {
        // session.send("Hello! I am VendorBot! How can I help you? ");
        console.log(results);
        builder.Prompts.text(session, "You can say something like, 'What is the status of my payment?' or 'I would like to know inventory details for products I supply'");
    },
    function (session, results) {
        RootMenu(session,results);
    },
    function (session,results) {
        console.log("root final : " + results.response);
        RootMenu(session,results);
    }
]);

function RootMenu(session,results) {
    console.log("Sagar Resp : " + results.response);
    if (results.response.toUpperCase().indexOf("PAYMENT") !== -1) {
        session.beginDialog('/payment',results.response);
    } else if (results.response.toUpperCase().indexOf("INVENTORY") !== -1) {
        session.beginDialog('/Inventory');
    }
    else if (results.response.toUpperCase().indexOf("ISSUE") !== -1) {
        session.beginDialog('/issues');
    }
    else if (results.response.toUpperCase().indexOf("CLEAR") !== -1) {
        session.beginDialog('/ClearData');
    }
    else if (results.response.toUpperCase().indexOf("NO") != -1) {
        session.endDialog();
    }
    else if (results.response.toUpperCase().indexOf("YES") != -1) {
        session.beginDialog('/');
    } else {
        session.send("Not Trained...");
        //session.endDialog();
    }
}

bot.dialog('/verification', [
    function (session) {
        builder.Prompts.text(session, 'Please Enter Your DUNS number');
    },
    function (session, results) {
        builder.Prompts.text(session,"An OTP has been sent to the registered email on file. Please Enter the OTP.");
    },
    function (session, results) {
        session.send(results.response);
        session.send("OTP Verified. Thank You");
        session.userData.isVerified = true;
        console.log("Verification Status is " + session.userData.isVerified );
        session.endDialog();
    }
    ]);

bot.dialog('/payment', [
    function (session,args,next) {
        var response = args || {};
        if (!session.userData.isVerified) {
            session.beginDialog('/verification');
        } else {
            if(response.toUpperCase().indexOf("PENDING") != -1)
            {
                session.beginDialog('/pendingPayments');
                //next();
            }
            else
            {
                session.beginDialog('/otherPayments');
            }

        }
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/otherPayments',[
    function (session) {
        builder.Prompts.choice(session, "Payments invoice list","5100000015|5100000041|5100000098|5100000124",{ listStyle: builder.ListStyle.button });
    },
    function (session,results) {
        var nextDate = Date.now();
        //nextDate = nextDate.addMonths(1)
        session.send("Following are the details of your invoice");
        session.send("Invoice No : " + results.response.entity + "\n\n Status   : Payment Released \n\n Clearing Date   : 3" + nextDate+"\n\n Transaction No : TNX6532233");
        session.beginDialog('/ConversationEnd');
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/pendingPayments',[
    function (session) {
        builder.Prompts.choice(session, "Pending Payments invoice list","5100000013|5100000023|5100000067|5100000110",{ listStyle: builder.ListStyle.button });
    },
    function (session,results) {
        var nextDate = Date.now();
        //nextDate = nextDate.addMonths(1)
        session.send("Following are the details of your invoice");
        session.send("Invoice No : " + results.response.entity + "\n\n Status   : Approved and Pending Payments \n\n Clearing Date   : 3" + nextDate);
        builder.Prompts.text(session, "would you like to connect with a representative?");
    },
    function (session,results) {
        if(results.response.toUpperCase().indexOf("YES") != -1)
        {
            session.send("Mr. Kunal Gaikwad \n\n Finance Executive \n\n Email : kunam.gaikwad@sapex.com \n\n Office : 020-2521134");
        }
        session.beginDialog('/ConversationEnd');
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Please select an option", "Payment Amount|Date of Payment|Payment Mode|Payment method|Bank|Main Menu", { listStyle: builder.ListStyle.button })
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.send("Amount is: $ 15,000");
                session.replaceDialog('rootMenu');
                break;
            case 1:
                session.send("Date is:  09/04/2017");
                session.replaceDialog('rootMenu');
                break;
            case 2:
                session.send("Payment Mode is: DD");
                session.replaceDialog('rootMenu');
                break;
            case 3:
                session.send("Payment Method is: DD");
                session.replaceDialog('rootMenu');
                break;
            case 4:
                session.send("Payment Bank is: ICICI");
                session.replaceDialog('rootMenu');
                break;
            case 5:
                session.endDialog();
                break;
        }
    }
]);

bot.dialog('/issues', [
    function (session,args,next) {
        if (!session.userData.isVerified) {
            session.beginDialog('/verification');
        } else {
            next();
        }
    },
    function (session,results) {
        builder.Prompts.text(session, 'Is this an existing issue or a new issue?');
    },
    function (session, results,next) {
        if (results.response.toUpperCase().indexOf("NEW") !== -1) {
            session.beginDialog('/newIssue');
        }
        else
        {
            session.beginDialog('/existingIssue');
        }
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/Inventory', [
    function (session,args,next) {
        if (!session.userData.isVerified) {
            session.beginDialog('/verification');
        } else {
            next();
        }
    },
    function (session,results) {
        builder.Prompts.choice(session, "The following products are supplied by you. Choose one to know more.", "Silicon Wafer 200 micron|Galvanized metal mesh 10*20|Polished Silicon Wafer 2 inches|Plain Weave screen 600 microns|Steel Cable wire 2 mm|Main Menu", { listStyle: builder.ListStyle.button })
    },
    function (session, results) {
        session.send("Following are the details of your product");
        session.send("Product : " + results.response.entity + "\n\n Stock   : 120 Units \n\n Weekly rate of consumption   : 46 Units \n\n Reorder Level : 50 ");
        session.beginDialog('/ConversationEnd');
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/newIssue', [
    function(session) {
        //session.send("OK! You have selected new issue, Please describe your issue in few words");
        builder.Prompts.text(session, 'OK! You have selected new issue, Please describe your issue in few words');
    },
    function (session, results) {
        builder.Prompts.text(session, 'what is priority (1-5)');
    },
    function (session, results) {
        session.send('Great! new issue created.Your issue key is 1234.');
        session.beginDialog('/ConversationEnd');
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/existingIssue', [
    function (session) {
        builder.Prompts.choice(session, "Ok! Please select one of the following issues", "VI-123|VI-234|VI-346", { listStyle: builder.ListStyle.button })
    },
    function (session, results) {
        session.send("Following are the details of your issue");
        session.send("Ticket No : "+ results.response.entity +"\n\nSummary   : Incorrect vendor contact details \n\n Priority   : 3");
        builder.Prompts.text(session, "would you like to escalate?");
    },
    function (session, results,next) {
        //session.send("Ok! Thank you");
        next();
    },
    function (session,results) {
        session.beginDialog('/ConversationEnd');
    },
    function (session,results) {
        session.endDialogWithResult(results);
    }
]);

bot.dialog('/ConversationEnd',[
    function (session) {
    console.log('this is end');
        builder.Prompts.text(session, 'I hope i have resolved your queries! Want to know more?');
    }
]);

// To Clear user Data cache
bot.dialog('/ClearData', [
    function (session) {
        session.userData.isVerified = false;
        session.beginDialog('/ConversationEnd');
    }
]);