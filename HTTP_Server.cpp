// Server side C program to demonstrate Socket programming
#include <stdio.h>
#include <sys/socket.h>
#include <unistd.h>
#include <stdlib.h>
#include <netinet/in.h>
#include <string.h>
#include <sys/types.h>
#include <fcntl.h>
#include <sys/sendfile.h>
#include <sys/stat.h>
#include <errno.h>

#include "HTTP_Server.h"


//#include <fstream>
//#include <sstream>
//#include <arpa/inet.h>
//#include <string>
//#include <netdb.h>
//#include <unistd.h>
//using namespace std;

#define PORT 8081


void sendGETresponse(int fd, char strFilePath[], char strResponse[]);
void sendPUTresponse(int fd, char strFilePath[], char strBody[], char strResponse[]);
void sendHEADresponse(int fd, char strFilePath[], char strResponse[]);
//void report(struct sockaddr_in *serverAddress);

//https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
//https://stackoverflow.com/questions/45670369/c-web-server-image-not-showing-up-on-browser
//https://www.linuxhowtos.org/C_C++/socket.htm

char HTTP_200HEADER[] = "HTTP/1.1 200 Ok\r\n";
char HTTP_201HEADER[] = "HTTP/1.1 201 CREATED\r\n";
char HTTP_404HEADER[] = "HTTP/1.1 404 Not Found\r\n";
char HTTP_400HEADER[] = "HTTP/1.1 400 Bad request\r\n";



int CreateHTTPserver(MS5611* ms5611, ADS1256* ads1256)
{
    int connectionSocket, clientSocket, pid; 
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    
    if ((connectionSocket = socket(AF_INET, SOCK_STREAM, 0)) == 0)
    {
        perror("socket open failed\n");
        exit(EXIT_FAILURE);
    }
    
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons( PORT );

    memset(address.sin_zero, '\0', sizeof address.sin_zero);
    
    if (bind(connectionSocket, (struct sockaddr *)&address, sizeof(address)) < 0)
    {
        perror("socket bind failed\n");
        close(connectionSocket);
        exit(EXIT_FAILURE);
    }
    
    if (listen(connectionSocket, 10) < 0)
    {
        perror("socket listen failed\n");
        exit(EXIT_FAILURE);
    }
    
    //report(&address);
    //setHttpHeader(httpHeader);
    
    while(1)
    {
        printf("\n+++++++ Waiting for a new connection ++++++++\n\n");
        if ((clientSocket = accept(connectionSocket, (struct sockaddr *)&address, (socklen_t*)&addrlen))<0)
        {
            perror("In accept");
            exit(EXIT_FAILURE);
        }
        
        //Create child process to handle request from different client
        pid = 0;//fork();
        if(pid < 0){
            perror("Error on fork");
            exit(EXIT_FAILURE);
        }
        
        if(pid == 0)
        {
            char  buffer[30000] = {0};
            char* ptrBuffer = &buffer[0];
            
            int iBytesRead = read(clientSocket, ptrBuffer, 30000);
            printf("\nClient message of %d bytes:\n%s\n", iBytesRead, buffer);
            
            if (iBytesRead == 0)
            {
				printf("Client closed connection prematurely\n");
				close(clientSocket);
				continue;
			}

            printf("\nParsing request...\n");

            // Parse Request method
            char strHTTP_requestMethod[10] = {0};
            char* pch = strchr(ptrBuffer, ' ');
            strncpy(strHTTP_requestMethod, ptrBuffer, pch-ptrBuffer);
            printf("Client method: %s\n", strHTTP_requestMethod);
            
            ptrBuffer = pch+1;

            // Parse Request path
            char strHTTP_requestPath[200] = {0};
			pch = strchr(ptrBuffer, ' ');
            strncpy(strHTTP_requestPath, ptrBuffer, pch-ptrBuffer);
            printf("Client asked for path: %s\n", strHTTP_requestPath);
            
            // Parse Request extension
            char strHTTPreqExt[200] = {0};
			pch = strrchr(strHTTP_requestPath, '.');
            if (pch != NULL) strcpy(strHTTPreqExt, pch+1);
            

            char strFilePath[500] = {0};
            char strResponse[500] = {0};

            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
            if (!strcmp(strHTTP_requestMethod, "HEAD"))
            {
                if(!strcmp(strHTTP_requestPath, "/"))
                {
                    //case that the strHTTP_requestPath = "/"  --> Send index.html file

                    sprintf(strFilePath, "./index.html");
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: text/html\r\n");

                    sendHEADresponse(clientSocket, strFilePath, strResponse);
                }
			}
            else if (!strcmp(strHTTP_requestMethod, "GET"))
            {
                if(!strcmp(strHTTP_requestPath, "/"))
                {
                    //case that the strHTTP_requestPath = "/"  --> Send index.html file
                    //write(clientSocket , httpHeader , strlen(httpHeader));

                    sprintf(strFilePath, "./index.html");
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: text/html\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else if(!strcmp(strHTTP_requestPath, "/BARAtemperature"))
                {
                    float fTemp = ms5611->readTemperature();
                    
                    char strTemperature[20];
                    sprintf(strTemperature, "%f", fTemp);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strTemperature));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strTemperature, strlen(strTemperature));
					printf("%s\n", strTemperature); 
                }
                else if(!strcmp(strHTTP_requestPath, "/BARApressure"))
                {
                    float fPressure = ms5611->readPressure();
                    
                    char strPressure[20];
                    sprintf(strPressure, "%f", fPressure);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strPressure));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strPressure, strlen(strPressure));
					printf("%s\n", strPressure); 
                }
                else if(!strcmp(strHTTP_requestPath, "/FOAthermocouple"))
                {
					float fValue = ads1256->GetThermocoupleVoltage();
					
                    char strVoltage[20];
                    sprintf(strVoltage, "%f", fValue);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strVoltage));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strVoltage, strlen(strVoltage));
					printf("%s\n", strVoltage); 
                }
                else if(!strcmp(strHTTP_requestPath, "/FOAthermistorV"))
                {
					float fValue = ads1256->GetThermistorVoltage();
					
                    char strVoltage[20];
                    sprintf(strVoltage, "%f", fValue);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strVoltage));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strVoltage, strlen(strVoltage));
					printf("%s\n", strVoltage); 
                }
                else if(!strcmp(strHTTP_requestPath, "/FOAthermistorR"))
                {
					float fValue = ads1256->GetThermistorResistance();
					
                    char strVoltage[20];
                    sprintf(strVoltage, "%f", fValue);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strVoltage));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strVoltage, strlen(strVoltage));
					printf("%s\n", strVoltage); 
                }
                else if(!strcmp(strHTTP_requestPath, "/FOAflux"))
                {
					float fThCvoltage = 0.0f;
					float fThR = 0.0f;
					float fValue = ads1256->GetFlux(fThCvoltage, fThR);
					
                    char strVoltage[20];
                    sprintf(strVoltage, "%f", fValue);
                    sprintf(strResponse, "%sContent-Type: text/html\r\nContent-Length: %ld\r\n\r\n", HTTP_200HEADER, strlen(strVoltage));
                    
                    write(clientSocket, strResponse, strlen(strResponse));
					printf("\nResponse:\n%s\n", strResponse); 

                    write(clientSocket, strVoltage, strlen(strVoltage));
					printf("%s\n", strVoltage); 
                }
                else if ((!strcmp(strHTTPreqExt, "JPG")) || (!strcmp(strHTTPreqExt, "jpg")))
                {
                    //send image to client

                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: image/jpeg\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else if (!strcmp(strHTTPreqExt, "ico"))
                {
                    //https://www.cisco.com/c/en/us/support/docs/security/web-security-appliance/117995-qna-wsa-00.html

                    sprintf(strFilePath, "./img/favicon.png");
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: image/vnd.microsoft.icon\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else if (!strcmp(strHTTPreqExt, "js"))
                {
                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: text/javascript\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else if (!strcmp(strHTTPreqExt, "gif"))
                {
                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: image/gif\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else if (!strcmp(strHTTPreqExt, "css"))
                {
                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: text/css\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
                else  // unknown mime type
                {
                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
                    sprintf(strResponse, "%s%s", HTTP_200HEADER, "Content-Type: text/plain\r\n");

                    sendGETresponse(clientSocket, strFilePath, strResponse);
                }
            }
            else if (!strcmp(strHTTP_requestMethod, "PUT"))
            {
				// search for body
				ptrBuffer = strstr(buffer, "\r\n\r\n");
				ptrBuffer +=4;
				
				if (ptrBuffer)
				{
                    sprintf(strFilePath, ".%s", strHTTP_requestPath);
					sprintf(strResponse, "%s", HTTP_201HEADER);
					
                    sendPUTresponse(clientSocket, strFilePath, ptrBuffer, strResponse);
				}
                //~ char *find_string = (char *)malloc(200);
                //~ find_string = find_token(buffer, "\r\n", "action");
                //~ strcat(copy_head, "Content-Type: text/plain \r\n\r\n"); //\r\n\r\n
                //~ //strcat(copy_head, "Content-Length: 12 \n");
                //~ strcat(copy_head, "User Action: ");
                //~ printf("find string: %s \n", find_string);
                //~ strcat(copy_head, find_string);
                //~ write(clientSocket, copy_head, strlen(copy_head));
            }
            close(clientSocket);
        }
        else
        {
            printf(">>>>>>>>>>Parent create child with pid: %d <<<<<<<<<", pid);
            close(clientSocket);
        }
    }
    
    close(connectionSocket);
    return 0;
}



//https://stackoverflow.com/questions/45670369/c-web-server-image-not-showing-up-on-browser
//http://www.tldp.org/LDP/LG/issue91/tranter.html
//https://linux.die.net/man/2/fstat
//http://man7.org/linux/man-pages/man2/stat.2.html
//http://man7.org/linux/man-pages/man2/sendfile.2.html
void sendGETresponse(int fdSocket, char strFilePath[], char strResponse[])
{
    int fdFile = open(strFilePath, O_RDONLY);
    if (fdFile < 0)
    {
		sprintf(strResponse, "%s", HTTP_404HEADER);
		write(fdSocket, strResponse, strlen(strResponse));
		
        printf("\nCannot open file path : %s with error %d\n", strFilePath, fdFile);
        printf("Response:\n%s\n", strResponse); 
        
        return;
    }
     
    struct stat stat_buf;  // hold information about input file
    fstat(fdFile, &stat_buf);
    
    int img_total_size = stat_buf.st_size;
    int block_size     = stat_buf.st_blksize;
    //printf("image block size: %d\n", stat_buf.st_blksize);  
    //printf("image total byte st_size: %d\n", stat_buf.st_size);
    
	// append another header
	char* strOffset = strResponse + strlen(strResponse);
	sprintf(strOffset, "Content-Length: %d\r\n\r\n", img_total_size);

    printf("\nResponse:\n%s\n", strResponse); 
    int iRes = write(fdSocket, strResponse, strlen(strResponse));
    if (iRes < 0)
    {
        printf("\nCannot write to client socket with error %d\n", iRes);
        return;
	}
		
	while(img_total_size > 0)
	{
		int iToSend = ((img_total_size < block_size) ? img_total_size : block_size);
		int done_bytes = sendfile(fdSocket, fdFile, NULL, iToSend);
		if (done_bytes < 0)
		{
			printf("\nCannot write to client socket with error %d\n", done_bytes);
			return;
		}
		  
		img_total_size = img_total_size - done_bytes;
	}
	close(fdFile);
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
void sendHEADresponse(int fdSocket, char strFilePath[], char strResponse[])
{
    int fdFile = open(strFilePath, O_RDONLY);
    if (fdFile < 0)
    {
		sprintf(strResponse, "%s", HTTP_404HEADER);
		write(fdSocket, strResponse, strlen(strResponse));
		
        printf("\nCannot open file path : %s with error %d\n", strFilePath, fdFile);
        printf("Response:\n%s\n", strResponse); 
        
        return;
    }
     
    struct stat stat_buf;  // hold information about input file
    fstat(fdFile, &stat_buf);
    
    int img_total_size = stat_buf.st_size;
    //printf("image block size: %d\n", stat_buf.st_blksize);  
    //printf("image total byte st_size: %d\n", stat_buf.st_size);
    
	// append another header
	char* strOffset = strResponse + strlen(strResponse);
	sprintf(strOffset, "Content-Length: %d\r\n\r\n", img_total_size);

    printf("\nResponse:\n%s\n", strResponse);
    int iRes = write(fdSocket, strResponse, strlen(strResponse));
    if (iRes < 0)
    {
        printf("\nCannot write to client socket with error %d\n", iRes);
        return;
	}

	close(fdFile);
}


void sendPUTresponse(int fdSocket, char strFilePath[], char strBody[], char strResponse[])
{
	int fdFile = open(strFilePath, O_WRONLY|O_CREAT|O_TRUNC, 0666);
    if (fdFile < 0)
    {
		sprintf(strResponse, "%s", HTTP_400HEADER);
		write(fdSocket, strResponse, strlen(strResponse));
		
        printf("\nCannot save file path : %s with error %d\n", strFilePath, fdFile);
        printf("Response:\n%s\n", strResponse); 
        
        return;
    }
    
    printf("\nResponse:\n%s\n", strResponse); 
    int iRes = write(fdSocket, strResponse, strlen(strResponse));
    if (iRes < 0)
    {
        printf("\nCannot write to client socket with error %d\n", iRes);
        return;
	}
    
    iRes = write(fdFile, strBody, strlen(strBody));
    if (iRes < 0)
    {
        printf("\nCannot write to file %s with error %d\n", strFilePath, fdFile);
        
        return;
    }
    
    close(fdFile);
}

/*
void setHttpHeader(char httpHeader[])
{   
    // File object to return
    
    FILE *htmlData = fopen("index.html", "r");

    char line[100];
    char responseData[1000000];
    if(htmlData){
        while (fgets(line, 100, htmlData) != 0 ) {
            strcat(responseData, line);
        }
        // char httpHeader[8000] = "HTTP/1.1 200 OK\r\n\n";
        strcat(httpHeader, responseData);
        fclose(htmlData);
    }
    else
    {
        printf("\n Read index.html file problem");
    }
}
*/


/*
void setHttpHeader_other(char httpHeader[], char *path)
{  
    // File object to return
    
    char path_head[500] = ".";
    strcat(path_head, path);
    printf("\n path head : %s", path_head);
    //printf("\n Length of httpheader: %d", strlen(httpHeader));
    
    FILE *htmlData1 = fopen(path_head, "r");

    ////char httpHeader1[8000] = "HTTP/1.1 200 OK\r\n\n";
    int size_data = 800000;
    char line[100];

    char *responseData;
    responseData = (char*)malloc(size_data * sizeof(char));  
    //https://stackoverflow.com/questions/5099669/invalid-conversion-from-void-to-char-when-using-malloc/5099675 

    if(htmlData1){
        
        while (fgets(line, 100, htmlData1) != 0 ) {
            strcat(responseData, line);
        }
        strcat(httpHeader, responseData);
        fclose(htmlData1);
        //free(responseData);      
    }
    else
    {
        printf("\n Read other file problem");
    }
    //delete[] responseData;
}
*/

/*void report(struct sockaddr_in *serverAddress)
{
    char hostBuffer[INET6_ADDRSTRLEN];
    char serviceBuffer[NI_MAXSERV]; // defined in `<netdb.h>`
    socklen_t addr_len = sizeof(*serverAddress);
    int err = getnameinfo(
        (struct sockaddr *) serverAddress,
        addr_len,
        hostBuffer,
        sizeof(hostBuffer),
        serviceBuffer,
        sizeof(serviceBuffer),
        NI_NUMERICHOST
    );
    if (err != 0) {
        printf("It's not working!!\n");
    }
    printf("\n\n\tServer listening on http://%s:%s\n", hostBuffer, serviceBuffer);
}
*/

/*
std::string read_image(const std::string& image_path){
    std::ifstream is(image_path.c_str(), std::ifstream::in);
    is.seekg(0, is.end);
    int flength = is.tellg();
    is.seekg(0, is.beg);
    char * buffer = new char[flength];
    is.read(buffer, flength);
    std::string image(buffer, flength);
    return image;
}

int send_image(int & fd, std::string& image){

    int body_length = image.size();
    const char * body = image.data();
    int response_length = body_length;
    char * buffer = new char[response_length];
    memcpy(buffer, body, body_length);

    int ret = write(fd, buffer, response_length);

    delete [] buffer;
    return ret;
}
*/





