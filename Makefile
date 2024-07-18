all: aztecbaro

aztecbaro: main.o MS5611.o ADS1256.o Dev_config.o HTTP_Server.o
	g++ -g -Wall main.o MS5611.o ADS1256.o Dev_config.o HTTP_Server.o -lwiringPi -o aztec.exe
	
main.o: main.cpp
	g++ -g -Wall -c main.cpp
	
MS5611.o: MS5611.cpp MS5611.h
	g++ -g -Wall -c MS5611.cpp
	
ADS1256.o: ADS1256.cpp ADS1256.h
	g++ -g -Wall -c ADS1256.cpp

Dev_config.o: Dev_config.cpp Dev_config.h
	g++ -g -Wall -c Dev_config.cpp

HTTP_Server.o: HTTP_Server.cpp HTTP_Server.h
	g++ -g -Wall -c HTTP_Server.cpp

clean:
	rm -rf -v *.o
	rm -rf -v *.gch
