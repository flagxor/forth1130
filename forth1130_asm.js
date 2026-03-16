// Charles Moore's 1968 "protoFORTH"
// Extracted from https://gitlab.com/unused0/protoforth
// Based on recovery work by Charles Anthony.
var forth_asm = `
0900 0  0000     00003    CONVE DC         CONVERT EBCDIC TO FORTH
0901 0  C1FF     00004          LD    1 -1   CHARACTER SET
0902 0  D002     00005          STO     CV1+1
0903 0  63C1     00006          LDX   3 -63
0904 00 C7000000 00007    CV1   LD   L3
0906 0  9100     00008          S     1    A
0907 00 4C18090B 00009          BZ      CV2
0909 0  7301     00010          MDX   3 1
090A 0  70F9     00011          B       CV1
090B 0  733F     00012    CV2   MDX   3 63
090C 0  1000     00013          NOP
090D 0  6B5F     00014          STX   3 TEMP
090E 0  C05E     00015          LD      TEMP
090F 0  D100     00016          STO   1    A
0910 00 4C800900 00017          B    I  CONVE
0912 0  0000     00018    ACCEP DC         NEXT CHARACTER FROM DISK
0913 0  C1FD     00019          LD    1 -3   C
0914 00 94000B28 00020          S    L  C2
0916 00 44180B2D 00021          BSI  L  RECOR,+-   NEXT RECORD
0918 0  C1FD     00022          LD    1 -3   C
0919 0  4054     00023          BSI     FETCH
091A 0  40E5     00024          BSI     CONVE
091B 00 4C800912 00025          B    I  ACCEP
091D 0  0000     00026    RETRV DC         FROM CORE
091E 0  C1FD     00027          LD    1 -3   C
091F 0  404E     00028          BSI     FETCH
0920 00 4C80091D 00029          B    I  RETRV
0922 0  0000     00030    NEXT  DC         NEXT WORD
0923 0  C1FA     00031          LD    1 -6   W1
0924 0  D102     00032          STO   1 2   W
0925 0  C03A     00033          LD      BL2
0926 0  D104     00034          STO   1 4   WORD+1
0927 00 4580FFFE 00035    NE1   BSI  I1 -2   ACCEPT
0929 0  C100     00036          LD    1    A
092A 0  9036     00037          S       BL
092B 00 4C200931 00038          BNZ     NE2
092D 0  C1FD     00039          LD    1 -3  C
092E 0  803D     00040          A       ONE
092F 0  D1FD     00041          STO   1 -3  C
0930 0  70F6     00042          B       NE1
0931 0  902B     00043    NE2   S       SC
0932 00 4C08093A 00044          BNP     ALPHA
0934 0  902A     00045          S       THREE
0935 00 4C280954 00046          BN      SPEC1
0937 0  9026     00047          S       TWO
0938 00 4C200954 00048          BNZ     SPEC1
093A 0  C102     00049    ALPHA LD    1 2   W   ALPHABETIC
093B 0  4043     00050          BSI     DEPOS
093C 00 4580FFFC 00051          BSI  I1 -4   SAVE
093E 0  C1FD     00052          LD    1 -3   C
093F 0  802C     00053          A       ONE
0940 0  D1FD     00054          STO   1 -3   C
0941 0  C102     00055          LD    1 2   W
0942 0  8029     00056          A       ONE
0943 0  D102     00057          STO   1 2
0944 00 4580FFFE 00058          BSI  I1 -2   ACCEP
0946 0  C100     00059          LD    1    A
0947 0  9019     00060          S       BL
0948 00 4C18094D 00061          BZ      AL1
094A 00 4CB00922 00062          BP   I  NEXT
094C 0  70ED     00063          B       ALPHA
094D 00 4580FFFC 00064    AL1   BSI  I1 -4   SAVE
094F 0  C1FD     00065          LD    1 -3   C
0950 0  801B     00066          A       ONE
0951 0  D1FD     00067          STO   1 -3   C
0952 00 4C800922 00068          B    I  NEXT
0954 0  C102     00069    SPEC1 LD    1 2   W   SPECIAL CHARACTER
0955 0  4029     00070          BSI     DEPOS
0956 00 4580FFFC 00071          BSI  I1 -4   SAVE
0958 0  C1FD     00072          LD    1 -3   C
0959 0  8012     00073          A       ONE
095A 0  D1FD     00074          STO   1 -3   C
095B 00 4C800922 00075          B    I  NEXT
095D 0  0014     00076    SC    DC      20
095E 0  0002     00077    TWO   DC      2
095F 0  0003     00078    THREE DC      3
0960 0  2424     00079    BL2   DC      /2424
0961 0  0024     00080    BL    DC      /24
0962 0  0000     00081    SAVE  DC         BUILD MEMORY
0963 0  C1FB     00082          LD    1 -5    D
0964 0  8007     00083          A       ONE
0965 0  D1FB     00084          STO   1 -5    D
0966 0  4018     00085          BSI     DEPOS
0967 00 4C800962 00086          B    I  SAVE
0969 0  0000     00087    SAVE0 DC         DUMMY
096A 00 4C800969 00088          B    I  SAVE0
096C 0  0001     00089    ONE   DC      1
096D 0  0000     00090    TEMP  DC      0
096E 0  0000     00091    FETCH DC      0   FETCH CHARACTER
096F 0  1881     00092          SRT     1
0970 0  D0FC     00093          STO     TEMP
0971 0  1081     00094          SLT     1
0972 00 4C040978 00095          BOD     FE1
0974 00 C480096D 00096          LD   I  TEMP   EVEN CHARACTER
0976 0  1808     00097          SRA     8
0977 0  7003     00098          B       FE2
0978 00 C480096D 00099    FE1   LD   I  TEMP   ODD CHARACTER
097A 0  E003     00100          AND     FF
097B 0  D100     00101    FE2   STO   1    A
097C 00 4C80096E 00102          B    I  FETCH
097E 0  00FF     00103    FF    DC      /00FF
097F 0  0000     00104    DEPOS DC         DEPOSIT CHARACTER
0980 0  1881     00105          SRT     1
0981 0  D0EB     00106          STO     TEMP
0982 0  1081     00107          SLT     1
0983 00 4C04098A 00108          BOD     DE1
0985 0  C100     00109          LD    1    A   EVEN CHARACTER
0986 0  100A     00110          SLA     10
0987 0  1802     00111          SRA     2
0988 0  E8D8     00112          OR      BL
0989 0  7004     00113          B       DE2
098A 00 C480096D 00114    DE1   LD   I  TEMP   ODD CHARACTER
098C 0  E005     00115          AND     FF00
098D 0  E900     00116          OR    1    A
098E 00 D480096D 00117    DE2   STO  I  TEMP
0990 00 4C80097F 00118          B    I  DEPOS
0992 0  FF00     00119    FF00  DC      /FF00
0993 0  0000     00120    DO    DC         INTERPRET WORD
0994 00 67800AD8 00121          LDX  I3 E
0996 0  73FC     00122    DO1   MDX   3 -4
0997 0  C300     00123          LD    3
0998 00 4C980993 00124          BZ   I  DO
099A 0  9103     00125          S     1 3   WORD
099B 00 4C200996 00126          BNZ     DO1
099D 0  C301     00127          LD    3 1
099E 0  9104     00128          S     1 4   WORD+1
099F 00 4C200996 00129          BNZ     DO1
09A1 00 4C800993 00130          B    I  DO
09A3 0  0000     00131    UNDEF DC         UNDEFINED SYMBOL
09A4 0  C103     00132          LD    1 3   WORD
09A5 0  E004     00133          AND     F000
09A6 00 441809AB 00134          BSI  L  HEX,+-
09A8 00 4C8009A3 00135          B    I  UNDEF
09AA 0  F000     00136    F000  DC      /F000
09AB 0  0000     00137    HEX   DC         HEXADECIMAL LITERAL
09AC 0  C102     00138          LD    1 2   W
09AD 0  91FA     00139          S     1 -6   W1
09AE 0  D0BE     00140          STO     TEMP
09AF 00 6780096D 00141          LDX  I3 TEMP
09B1 0  7201     00142          MDX   2 1
09B2 0  1810     00143          SRA     16
09B3 0  D200     00144          STO   2
09B4 0  C1FA     00145          LD    1 -6   W1
09B5 0  D102     00146    HE1   STO   1 2   W
09B6 0  40B7     00147          BSI     FETCH
09B7 0  C200     00148          LD    2
09B8 0  1004     00149          SLA     4
09B9 0  E900     00150          OR    1    A
09BA 0  D200     00151          STO   2
09BB 0  C102     00152          LD    1 2   W
09BC 0  80AF     00153          A       ONE
09BD 0  73FF     00154          MDX   3 -1
09BE 0  70F6     00155          B       HE1
09BF 00 4C8009AB 00156          B    I  HEX
09C1 0  0000     00157    ENTRY DC         INITIAL ENTRY
09C2 00 44000922 00158          BSI  L  NEXT
09C4 00 74040AD7 00159          MDM  L  E1,4
09C6 00 67800AD7 00160          LDX  I3 E1
09C8 00 6F000AD8 00161          STX  L3 E
09CA 00 74040AD8 00162          MDM  L  E,4
09CC 0  C103     00163          LD    1 3   WORD
09CD 0  D300     00164          STO   3
09CE 0  C104     00165          LD    1 4   WORD+1
09CF 0  D301     00166          STO   3 1
09D0 00 4C8009C1 00167          B    I  ENTRY
09D2 0  0000     00168    ENTER DC         ADD TO SYMBOL TABLE
09D3 0  40ED     00169          BSI     ENTRY
09D4 00 C4000A55 00170          LD   L  INTER
09D6 0  D302     00171          STO   3 2
09D7 00 C4000D83 00172          LD   L  IC
09D9 0  1001     00173          SLA     1
09DA 0  8091     00174          A       ONE
09DB 0  D1FB     00175          STO   1 -5   D
09DC 0  808F     00176          A       ONE
09DD 0  D303     00177          STO   3 3
09DE 0  C016     00178          LD      ASAVE   SKIP OVER DEFINITION
09DF 0  D1FC     00179          STO   1 -4   SAVE
09E0 00 44000922 00180    EN1   BSI  L  NEXT
09E2 0  C015     00181          LD      COMMA
09E3 00 94000AE2 00182          S    L  WORD
09E5 00 4C2009EF 00183          BNZ     EN2
09E7 0  C1FB     00184    EN3   LD    1 -5   D
09E8 0  1801     00185          SRA     1
09E9 00 D4000D83 00186          STO  L  IC
09EB 0  C00A     00187          LD      ASAV0
09EC 0  D1FC     00188          STO   1 -4   SAVE
09ED 00 4C8009D2 00189          B    I  ENTER
09EF 0  C007     00190    EN2   LD      DOT
09F0 00 94000AE2 00191          S    L  WORD
09F2 00 4C2009E0 00192          BNZ     EN1
09F4 0  70F2     00193          B       EN3
09F5 0  0962     00194    ASAVE DC      SAVE
09F6 0  0969     00195    ASAV0 DC      SAVE0
09F7 0  3024     00196    DOT   DC      /3024   SEMICOLON
09F8 0  3424     00197    COMMA DC      /3424   ,
09F9 0  0000     00198    X3    DC
09FA 0  6BFE     00199          STX   3 X3
09FB 00 66000AF7 00200    START LDX  L2 STACK+1   RESTART LOCATION
09FD 00 65000ADF 00201          LDX  L1 A
09FF 00 67000B07 00202          LDX  L3 INTST
0A01 00 6F000B06 00203          STX  L3 R
0A03 00 67000DC0 00204          LDX  L3 E2
0A05 00 6F000AD7 00205          STX  L3 E1
0A07 0  7304     00206          MDX   3 4
0A08 00 6F000AD8 00207          STX  L3 E
0A0A 00 67001860 00208          LDX  L3 2*SECT+74
0A0C 00 6F000AF6 00209          STX  L3 STACK
0A0E 00 6F000B28 00210          STX  L3 C2
0A10 00 670000B3 00211          LDX  L3 /B3
0A12 00 6F00000A 00212          STX  L3 /A
0A14 00 67000A31 00213          LDX  L3 FORTH
0A16 00 6F000AF7 00214          STX  L3 STACK+1
0A18 00 67000912 00215          LDX  L3 ACCEP
0A1A 00 6F000ADD 00216          STX  L3 A-2
0A1C 00 67000C09 00217          LDX  L3 BCD+63
0A1E 00 6F000ADE 00218          STX  L3 A-1
0A20 00 67000969 00219          LDX  L3 SAVE0
0A22 00 6F000ADB 00220          STX  L3 A-4
0A24 00 670019FF 00221          LDX  L3 /19FF
0A26 00 6F000D83 00222          STX  L3 IC
0A28 00 670010EE 00223          LDX  L3 /10EE
0A2A 00 6F000C0B 00224          STX  L3 SECT
0A2C 0  400E     00225          BSI     RECUR
0A2D 00 02053580 00226          LINK    BALO
0A31 0  72FF     00227    FORTH MDX   2 -1
0A32 0  C201     00228          LD    2 1
0A33 0  D1FD     00229          STO   1 -3   C
0A34 00 44000922 00230    FO1   BSI  L  NEXT
0A36 00 44000993 00231          BSI  L  DO
0A38 00 47800002 00232          BSI  I3 2
0A3A 0  70F9     00233          B       FO1
0A3B 0  0000     00234    RECUR DC
0A3C 0  C0FE     00235          LD      RECUR
0A3D 00 D4800B06 00236          STO  I  R
0A3F 00 74010B06 00237          MDM  L  R,1
0A41 0  72FF     00238          MDX   2 -1
0A42 00 4E800001 00239          B    I2 1
0A44 0  0000     00240    RETUR DC
0A45 00 74FF0B06 00241          MDM  L  R,-1
0A47 00 67800B06 00242          LDX  I3 R
0A49 00 4F800000 00243          B    I3 0
0A4B 0  0000     00244    INC   DC         INCREMENT COUNTER
0A4C 00 C6800000 00245          LD   I2
0A4E 00 8400096C 00246          A    L  ONE
0A50 00 D6800000 00247          STO  I2
0A52 0  D200     00248          STO   2
0A53 00 4C800A4B 00249          B    I  INC
0A55 0  0A56     00250    INTER DC      *
0A56 0  0000     00251          DC         INTERPRET
0A57 00 C4000AD8 00252          LD   L  E
0A59 00 D4800B06 00253          STO  I  R
0A5B 00 6F000AD8 00254          STX  L3 E
0A5D 00 74010B06 00255          MDM  L  R,1
0A5F 0  C1FD     00256          LD    1 -3   C
0A60 00 D4800B06 00257          STO  I  R
0A62 00 74010B06 00258          MDM  L  R,1
0A64 0  C303     00259          LD    3 3
0A65 0  D1FD     00260          STO   1 -3   C
0A66 0  C1FE     00261          LD    1 -2   ACCEPT
0A67 00 D4800B06 00262          STO  I  R
0A69 00 74010B06 00263          MDM  L  R,1
0A6B 0  C003     00264          LD      ARETR
0A6C 0  D1FE     00265          STO   1 -2   ACCEP
0A6D 00 4C800A56 00266          B    I  INTER+1
0A6F 0  091D     00267    ARETR DC      RETRV
0A70 0  0000     00268    COM   DC        END INTERPRET
0A71 00 74FD0B06 00269          MDM  L  R,-3
0A73 00 67800B06 00270          LDX  I3 R
0A75 0  C301     00271          LD    3 1
0A76 0  D1FD     00272          STO   1 -3   C
0A77 0  C302     00273          LD    3 2
0A78 0  D1FE     00274          STO   1 -2   ACCEPT
0A79 0  C300     00275          LD    3
0A7A 00 94000AD8 00276          S    L  E
0A7C 00 4C880A70 00277          BNP  I  COM
0A7E 0  C300     00278          LD    3 0
0A7F 00 D4000AD8 00279          STO  L  E
0A81 00 4C800A70 00280          B    I  COM
0A83 0  0000     00281    LOC   DC         LOCATION OF CODE
0A84 00 44000922 00282          BSI  L  NEXT
0A86 00 44000993 00283          BSI  L  DO
0A88 0  C302     00284          LD    3 2
0A89 0  7201     00285          MDX   2 1
0A8A 0  D200     00286          STO   2
0A8B 00 4C800A83 00287          B    I  LOC
0A8D 0  0000     00288    OR    DC         OR TOP OF STACK
0A8E 0  C200     00289          LD    2
0A8F 0  72FF     00290          MDX   2 -1
0A90 0  EA00     00291          OR    2
0A91 0  D200     00292          STO   2
0A92 00 4C800A8D 00293          B    I  OR
0A94 0  0000     00294    STORE DC         STORE TO T.O.S
0A95 0  C2FF     00295          LD    2 -1
0A96 00 D6800000 00296          STO  I2
0A98 0  72FE     00297          MDX   2 -2
0A99 00 4C800A94 00298          B    I  STORE
0A9B 0  0000     00299    SD    DC         STACK TO DEPOSIT
0A9C 0  C200     00300          LD    2
0A9D 00 74010D83 00301          MDM  L  IC,1
0A9F 00 D4800D83 00302          STO  I  IC
0AA1 0  72FF     00303          MDX   2 -1
0AA2 00 4C800A9B 00304          B    I  SD
0AA4 0  0AA5     00305    ADDR  DC      *
0AA5 0  0000     00306          DC         PLACE ADDRESS ON STACK
0AA6 0  7201     00307          MDX   2 1
0AA7 00 6F00096D 00308          STX  L3 TEMP
0AA9 00 7403096D 00309          MDM  L  TEMP,3
0AAB 00 C400096D 00310          LD   L  TEMP
0AAD 0  D200     00311          STO   2
0AAE 00 4C800AA5 00312          B    I  ADDR+1
0AB0 0  0AB1     00313    LITER DC      *
0AB1 0  0000     00314          DC         PLACE VALUE ON STACK
0AB2 0  7201     00315          MDX   2 1
0AB3 0  C303     00316          LD    3 3
0AB4 0  D200     00317          STO   2
0AB5 00 4C800AB1 00318          B    I  LITER+1
0AB7 0  0000     00319    OPER  DC         OPERATION
0AB8 00 440009C1 00320          BSI  L  ENTRY
0ABA 00 74010D83 00321          MDM  L  IC,1
0ABC 00 C4000D83 00322          LD   L  IC
0ABE 0  7201     00323          MDX   2 1
0ABF 0  D200     00324          STO   2
0AC0 0  D302     00325          STO   3 2
0AC1 00 4C800AB7 00326          B    I  OPER
0AC3 0  0000     00327    CONS  DC         CONSTANT
0AC4 00 44000922 00328          BSI  L  NEXT
0AC6 00 440009C1 00329          BSI  L  ENTRY
0AC8 0  C0E7     00330          LD      LITER
0AC9 0  D302     00331          STO   3 2
0ACA 0  C200     00332          LD    2
0ACB 0  D303     00333          STO   3 3
0ACC 0  72FF     00334          MDX   2 -1
0ACD 00 4C800AC3 00335          B    I  CONS
0ACF 0  0000     00336    INTEG DC         DECLARE INTEGER
0AD0 00 67800AD8 00337          LDX  I3 E
0AD2 0  C0D1     00338          LD      ADDR
0AD3 0  D302     00339          STO   3 2
0AD4 0  40D0     00340          BSI     ADDR+1
0AD5 00 4C800ACF 00341          B    I  INTEG
0AD7 0  0000     00342    E1    DC         TOP OR SYMBOL TABLE
0AD8 0  0000     00343    E     DC         THE PLACE TO START SEARCHES
0AD9 0  15C4     00344    W1    DC      2*WORD   -6
0ADA 0  0000     00345          DC         D  - 5   SAVE CHARACTER
0ADB 0  0000     00346          DC         -4   SAVE OPERATION
0ADC 0  0000     00347          DC         C   -3   CURRENT CHARACTER
0ADD 0  0000     00348          DC         -2   ACCEPT
0ADE 0  0000     00349          DC        -1   CHARACTER TABLE
0ADF 0  0000     00350    A     DC         A   XR1   CURRENT CHARACTER
0AE0 0  0000     00351    N     DC         1
0AE1 0  0000     00352          DC         W   2   WORD CHARACTER
0AE2    0014     00353    WORD  BSS     20   3
0AF6    0010     00354    STACK BSS     16
0B06 0  0000     00355    R     DC
0B07    0020     00356    INTST BSS     32
0B27 0  1AE0     00357    C1    DC      2*SECT+642+72   RESET CHARACTER
0B28 0  0000     00358    C2    DC         CHARACTER BEYOND RECORD
0B29 0  1860     00359    C3    DC      2*SECT+74   VHARACTER BEYOND SECTOR
0B2A 0  0000     00360    ERROR DC      0
0B2B 00 4C800B2A 00361          B    I  ERROR
0B2D 0  0000     00362    RECOR DC      0   NEXT RECORD
0B2E 0  C1FD     00363          LD    1 -3   C
0B2F 0  90F9     00364          S       C3
0B30 00 44180B3B 00365          BSI  L  BLOCK,+-   NEXT BLOCK
0B32 0  C1FD     00366          LD    1 -3   C
0B33 0  9006     00367          S       D152
0B34 0  D1FD     00368          STO   1 -3
0B35 00 74B00B28 00369          MDM  L  C2,-80
0B37 0  4017     00370          BSI     FIXUP
0B38 00 4C800B2D 00371          B    I  RECOR
0B3A 0  0098     00372    D152  DC      152
0B3B 0  0000     00373    BLOCK DC      0   NEXT BLOCK
0B3C 00 678009F9 00374          LDX  I3 X3
0B3E 20 042624B1 00375          LIBF    DISK1
0B3F 0  1000     00376          DC      /1000
0B40 0  0C0A     00377          DC      BUF
0B41 0  0B2A     00378          DC      ERROR
0B42 20 042624B1 00379    BL1   LIBF    DISK1
0B43 0  0000     00380          DC      /0000
0B44 0  0C0A     00381          DC      BUF
0B45 0  70FC     00382          B       BL1
0B46 00 74010C0B 00383          MDM  L  SECT,1
0B48 00 C4000B27 00384          LD   L  C1
0B4A 0  D1FD     00385          STO   1 -3   C
0B4B 00 D4000B28 00386          STO  L  C2
0B4D 00 4C800B3B 00387          B    I  BLOCK
0B4F 0  0000     00388    FIXUP DC         RE-ARRANGE RECORD
0B50 0  C1FD     00389          LD    1 -3   C
0B51 0  1801     00390          SRA     1
0B52 00 D4000B6D 00391          STO  L  FX1
0B54 00 D4000B6E 00392          STO  L  FX2
0B56 00 74270B6E 00393          MDM  L  FX2,39
0B58 0  6314     00394          LDX   3 20
0B59 00 C4800B6D 00395    FI1   LD   I  FX1
0B5B 00 D400096D 00396          STO  L  TEMP
0B5D 00 C4800B6E 00397          LD   I  FX2
0B5F 00 D4800B6D 00398          STO  I  FX1
0B61 00 C400096D 00399          LD   L  TEMP
0B63 00 D4800B6E 00400          STO  I  FX2
0B65 00 74010B6D 00401          MDM  L  FX1,1
0B67 00 74FF0B6E 00402          MDM  L  FX2,-1
0B69 0  73FF     00403          MDX   3 -1
0B6A 0  70EE     00404          B       FI1
0B6B 00 4C800B4F 00405          B    I  FIXUP
0B6D 0  0000     00406    FX1   DC
0B6E 0  0000     00407    FX2   DC
0B6F 0  0000     00408    PUT   DC         OUTPUT CHARACTER
0B70 0  C100     00409          LD    1    A
0B71 0  D02F     00410          STO     AP
0B72 00 67800BA1 00411          LDX  I3 AP
0B74 00 C7000BCA 00412          LD   L3 BCD
0B76 0  D100     00413          STO   1    A
0B77 00 C4000BA3 00414          LD   L  DP
0B79 00 4400097F 00415          BSI  L  DEPOS
0B7B 00 74010BA3 00416          MDM  L  DP,1
0B7D 0  C025     00417          LD      DP
0B7E 0  9025     00418          S       DP1
0B7F 00 44180B85 00419          BSI  L  PRINT,+-
0B81 0  C01F     00420          LD      AP
0B82 0  D100     00421          STO   1    A
0B83 00 4C800B6F 00422          B    I  PUT
0B85 0  0000     00423    PRINT DC      0   PRINT RECORD
0B86 00 C4000C09 00424          LD   L  BCDBL
0B88 0  D100     00425          STO   1    A
0B89 0  C019     00426    PR2   LD      DP
0B8A 0  9019     00427          S       DP1
0B8B 00 4C180B94 00428          BZ      PR3
0B8D 00 C4000BA3 00429          LD   L  DP
0B8F 00 4400097F 00430          BSI  L  DEPOS
0B91 00 74010BA3 00431          MDM  L  DP,1
0B93 0  70F5     00432          B       PR2
0B94 00 678009F9 00433    PR3   LDX  I3 X3
0B96 20 176558F1 00434          LIBF    PRNT1
0B97 0  2000     00435          DC      /2000
0B98 0  0BA5     00436          DC      PRN
0B99 0  0B2A     00437          DC      ERROR
0B9A 20 176558F1 00438    PR1   LIBF    PRNT1
0B9B 0  0000     00439          DC      /0000
0B9C 0  70FD     00440          B       PR1
0B9D 0  C004     00441          LD      DP0
0B9E 0  D004     00442          STO     DP
0B9F 00 4C800B85 00443          B    I  PRINT
0BA1 0  0000     00444    AP    DC
0BA2 0  174C     00445    DP0   DC      2*PRN+2
0BA3 0  174C     00446    DP    DC      2*PRN+2
0BA4 0  1794     00447    DP1   DC      2*PRN+74
0BA5 0  0024     00448    PRN   DC      36
0BA6    0024     00449          BSS     36
0BCA 0  00F0     00450    BCD   DC      240   0
0BCB 0  00F1     00451          DC      241   1
0BCC 0  00F2     00452          DC      242   2
0BCD 0  00F3     00453          DC      243   3
0BCE 0  00F4     00454          DC      244   4
0BCF 0  00F5     00455          DC      245   5
0BD0 0  00F6     00456          DC      246   6
0BD1 0  00F7     00457          DC      247   7
0BD2 0  00F8     00458          DC      248   8
0BD3 0  00F9     00459          DC      249   9
0BD4 0  00C1     00460          DC      193   A
0BD5 0  00C2     00461          DC      194   B
0BD6 0  00C3     00462          DC      195   C
0BD7 0  00C4     00463          DC      196   D
0BD8 0  00C5     00464          DC      197   E
0BD9 0  00C6     00465          DC      198   F
0BDA 0  00C7     00466          DC      199   G
0BDB 0  00C8     00467          DC      200   H
0BDC 0  00C9     00468          DC      201   I
0BDD 0  00D1     00469          DC      209   J
0BDE 0  00D2     00470          DC      210   K
0BDF 0  00D3     00471          DC      211   L
0BE0 0  00D4     00472          DC      212   M
0BE1 0  00D5     00473          DC      213   N
0BE2 0  00D6     00474          DC      214   O
0BE3 0  00D7     00475          DC      215   P
0BE4 0  00D8     00476          DC      216   Q
0BE5 0  00D9     00477          DC      217   R
0BE6 0  00E2     00478          DC      226   S
0BE7 0  00E3     00479          DC      227   T
0BE8 0  00E4     00480          DC      228   U
0BE9 0  00E5     00481          DC      229   V
0BEA 0  00E6     00482          DC      230   W
0BEB 0  00E7     00483          DC      231   X
0BEC 0  00E8     00484          DC      232   Y
0BED 0  00E9     00485          DC      233   Z
0BEE 0  0040     00486          DC      64   BLANK   /24
0BEF 0  004A     00487          DC      74   CENTS
0BF0 0  007B     00488          DC      123   NUMBER
0BF1 0  004C     00489          DC      76   LESS THAN
0BF2 0  004D     00490          DC      77   (
0BF3 0  004E     00491          DC      78   +
0BF4 0  004F     00492          DC      79   STROKE
0BF5 0  0050     00493          DC      80   AMPERSAND   /2B
0BF6 0  005A     00494          DC      90   EXCLAME
0BF7 0  005B     00495          DC      91   $
0BF8 0  005C     00496          DC      92   *
0BF9 0  005D     00497          DC      93   )
0BFA 0  005E     00498          DC      94   SEMI COLON
0BFB 0  005F     00499          DC      95   NOT
0BFC 0  0060     00500          DC      96   -
0BFD 0  0061     00501          DC      97   /
0BFE 0  006B     00502          DC      107   ,   /34
0BFF 0  006C     00503          DC      108   PERCENT
0C00 0  006D     00504          DC      109   UNDERSCORE
0C01 0  006E     00505          DC      110   GREATER THAN
0C02 0  006F     00506          DC      111   QUESTION
0C03 0  007A     00507          DC      122   COLON
0C04 0  004B     00508          DC      75   .   3D
0C05 0  007C     00509          DC      124   AT
0C06 0  007D     00510          DC      125   '
0C07 0  007E     00511          DC      126   =
0C08 0  007F     00512          DC      127   QUOTE   /3E
0C09 0  0040     00513    BCDBL DC      64   BL
0C0A 0  0140     00514    BUF   DC      320   SECTOR BUFFER
0C0B 0  0000     00515    SECT  DC
0C0C    0140     00516          BSS     320
0D4C 0  0000     00517          DC
0D4D 0  0000     00518          DC
0D4E 0  09A3     00519          DC      UNDEF
0D4F 0  0000     00520          DC
0D50 0  0F18     00521          DC      /0F18   FORTH
0D51 0  1B1D     00522          DC      /1B1D
0D52 0  0A31     00523          DC      FORTH
0D53 0  0000     00524          DC
0D54 0  1B0E     00525          DC      /1B0E   RECURSE
0D55 0  0C1E     00526          DC      /0C1E
0D56 0  0AB1     00527          DC      LITER+1
0D57 0  0B06     00528          DC      R
0D58 0  0F12     00529          DC      /0F12   FIND
0D59 0  170D     00530          DC      /170D
0D5A 0  0993     00531          DC      DO
0D5B 0  0000     00532          DC
0D5C 0  0A0D     00533          DC      /0A0D   ADDRESS
0D5D 0  0D1B     00534          DC      /0D1B
0D5E 0  0AA5     00535          DC      ADDR+1
0D5F 0  0000     00536          DC
0D60 0  0E17     00537          DC      /0E17   END
0D61 0  0D24     00538          DC      /0D24
0D62 0  0A70     00539          DC      COM
0D63 0  0000     00540          DC
0D64 0  110E     00541          DC      /110E   HEX
0D65 0  2124     00542          DC      /2124
0D66 0  09AB     00543          DC      HEX
0D67 0  0000     00544          DC
0D68 0  181B     00545          DC      /181B   OR
0D69 0  2424     00546          DC      /2424
0D6A 0  0A8D     00547          DC      OR
0D6B 0  0000     00548          DC
0D6C 0  3D24     00549          DC      /3D24   =
0D6D 0  2424     00550          DC      /2424
0D6E 0  0A94     00551          DC      STORE
0D6F 0  0000     00552          DC
0D70 0  3924     00553          DC      /3924   COLON
0D71 0  2424     00554          DC      /2424
0D72 0  09D2     00555          DC      ENTER
0D73 0  0000     00556          DC
0D74 0  3A24     00557          DC      /3A24   .
0D75 0  2424     00558          DC      /2424
0D76 0  09D2     00559          DC      ENTER
0D77 0  0000     00560          DC
0D78 0  3024     00561          DC      /3024   SEMICOLON
0D79 0  2424     00562          DC      /2424
0D7A 0  0A70     00563          DC      COM
0D7B 0  0000     00564          DC
0D7C 0  3424     00565          DC      /3424   ,
0D7D 0  2424     00566          DC      /2424
0D7E 0  0A70     00567          DC      COM
0D7F 0  0000     00568          DC
0D80 0  120C     00569          DC      /120C   IC
0D81 0  2424     00570          DC      /2424
0D82 0  0AA5     00571          DC      ADDR+1
0D83 0  0000     00572    IC    DC
0D84 0  2524     00573          DC      /2524   CENT
0D85 0  2424     00574          DC      /2424
0D86 0  0AB7     00575          DC      OPER
0D87 0  0000     00576          DC
0D88 0  1819     00577          DC      /1819   OPERATION
0D89 0  0E1B     00578          DC      /0E1B
0D8A 0  0AB7     00579          DC      OPER
0D8B 0  0000     00580          DC
0D8C 0  0E17     00581          DC      /0E17   ENTRY
0D8D 0  1D18     00582          DC      /1D18
0D8E 0  09C1     00583          DC      ENTRY
0D8F 0  0000     00584          DC
0D90 0  1217     00585          DC      /1217   INTEGER
0D91 0  1D0E     00586          DC      /1D0E
0D92 0  0ACF     00587          DC      INTEG
0D93 0  0000     00588          DC
0D94 0  1217     00589          DC      /1217   INC
0D95 0  0C24     00590          DC      /0C24
0D96 0  0A4B     00591          DC      INC
0D97 0  0000     00592          DC
0D98 0  1C0D     00593          DC      /1C0D   SD
0D99 0  2424     00594          DC      /2424
0D9A 0  0A9B     00595          DC      SD
0D9B 0  0000     00596          DC
0D9C 0  0C18     00597          DC      /0C18   CONVERT
0D9D 0  171F     00598          DC      /171F
0D9E 0  0900     00599          DC      CONVE
0D9F 0  0000     00600          DC
0DA0 0  0F0E     00601          DC      /0F0E   FETCH
0DA1 0  1D0C     00602          DC      /1D0C
0DA2 0  096E     00603          DC      FETCH
0DA3 0  0000     00604          DC
0DA4 0  0D0E     00605          DC      /0D0E   DEPOSIT
0DA5 0  1918     00606          DC      /1918
0DA6 0  097F     00607          DC      DEPOS
0DA7 0  0000     00608          DC
0DA8 0  191E     00609          DC      /191E   PUT
0DA9 0  1D24     00610          DC      /1D24
0DAA 0  0B6F     00611          DC      PUT
0DAB 0  0000     00612          DC
0DAC 0  191B     00613          DC      /191B   PRINT
0DAD 0  1217     00614          DC      /1217
0DAE 0  0B85     00615          DC      PRINT
0DAF 0  0000     00616          DC
0DB0 0  170E     00617          DC      /170E   NEXT
0DB1 0  211D     00618          DC      /211D
0DB2 0  0922     00619          DC      NEXT
0DB3 0  0000     00620          DC
0DB4 0  1518     00621          DC      /1518   LOC
0DB5 0  0C24     00622          DC      /0C24
0DB6 0  0A83     00623          DC      LOC
0DB7 0  0000     00624          DC
0DB8 0  0E24     00625          DC      /0E24   E
0DB9 0  2424     00626          DC      /2424
0DBA 0  0AB1     00627          DC      LITER+1
0DBB 0  0AD8     00628          DC      E
0DBC 0  1512     00629          DC      /1512   LIT
0DBD 0  1D24     00630          DC      /1D24
0DBE 0  0AB1     00631          DC      LITER+1
0DBF 0  0000     00632          DC
0DC0 0  0E01     00633    E2    DC      /0E01  E1
0DC1 0  2424     00634          DC      /2424
0DC2 0  0AB1     00635          DC      LITER+1
0DC3 0  0AD7     00636          DC      E1
0DC4    09FA     00637          END     START-1
`;
